/* eslint-disable max-lines */
/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

import type { Gemaelde, GemaeldeData } from '../entity';
import {
    GemaeldeInvalid,
    GemaeldeNotExists,
    GemaeldeServiceError,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
    ZertifizierungExists,
} from './errors';
import { GemaeldeModel, validateGemaelde } from '../entity';
import { cloud, logger, mailConfig } from '../../shared';
import type { QueryOptions } from 'mongoose';
import type { SendMailOptions } from 'nodemailer';

// API-Dokumentation zu Mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/* eslint-disable no-null/no-null, unicorn/no-useless-undefined, @typescript-eslint/no-unsafe-assignment */

/**
 * Die Klasse `GemaeldeService` implementiert den Anwendungskern für Bücher und
 * greift mit _Mongoose_ auf MongoDB zu.
 */
export class GemaeldeService {
    private static readonly UPDATE_OPTIONS: QueryOptions = { new: true };

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C# und Mono<> aus Project Reactor
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Gemaelde asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Gemaeldees
     * @returns Das gefundene Gemaelde vom Typ {@linkcode GemaeldeData} oder undefined
     */
    async findById(id: string) {
        logger.debug('GemaeldeService.findById(): id=%s', id);

        // ein Gemaelde zur gegebenen ID asynchron mit Mongoose suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // Das Resultat ist null, falls nicht gefunden.
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document,
        // so dass u.a. der virtuelle getter "id" auch nicht mehr vorhanden ist.
        const gemaelde = await GemaeldeModel.findById(
            id,
        ).lean<GemaeldeData | null>();
        logger.debug('GemaeldeService.findById(): gemaelde=%o', gemaelde);

        if (gemaelde === null) {
            return undefined;
        }

        this.deleteTimestamps(gemaelde);
        return gemaelde;
    }

    /**
     * Bücher asynchron suchen.
     * @param query Die DB-Query als JSON-Objekt
     * @returns Ein JSON-Array mit den gefundenen Büchern. Ggf. ist das Array leer.
     */
    // eslint-disable-next-line max-lines-per-function
    async find(query?: any | undefined) {
        logger.debug('GemaeldeService.find(): query=%o', query);

        // alle Gemaelde asynchron suchen u. aufsteigend nach titel sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            logger.debug('GemaeldeService.find(): alle Gemaelde');
            // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
            const gemaelden = await GemaeldeModel.find()
                .sort('titel')
                .lean<GemaeldeData[]>();
            for await (const gemaelde of gemaelden) {
                this.deleteTimestamps(gemaelde);
            }
            return gemaelden;
        }

        // { titel: 'a', rating: 5, javascript: true }
        // Rest Properties
        const { titel, javascript, typescript, ...dbQuery } = query;

        // Gemaelde zur Query (= JSON-Objekt durch Express) asynchron suchen
        // Titel in der Query: Teilstring des Titels,
        // d.h. "LIKE" als regulaerer Ausdruck
        // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
        // NICHT /.../, weil das Muster variabel sein muss
        // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (titel !== undefined && titel.length < 10) {
            // RegExp statt Re2 wegen Mongoose
            dbQuery.titel = new RegExp(titel, 'iu'); // eslint-disable-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
        }

        // z.B. {javascript: true, typescript: true}
        const kategorien = [];
        if (javascript === 'true') {
            kategorien.push('JAVASCRIPT');
        }
        if (typescript === 'true') {
            kategorien.push('TYPESCRIPT');
        }
        if (kategorien.length === 0) {
            delete dbQuery.schlagwoerter;
        } else {
            dbQuery.schlagwoerter = kategorien;
        }

        logger.debug('GemaeldeService.find(): dbQuery=%o', dbQuery);

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // GemaeldeModel.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        const buecher = await GemaeldeModel.find(dbQuery).lean<
            GemaeldeData[]
        >();
        for await (const gemaelde of buecher) {
            this.deleteTimestamps(gemaelde);
        }

        return buecher;
    }

    /**
     * Ein neues Gemaelde soll angelegt werden.
     * @param gemaelde Das neu abzulegende Gemaelde
     * @returns Die ID des neu angelegten Gemaeldees oder im Fehlerfall
     * - {@linkcode GemaeldeInvalid} falls die Gemaeldedaten gegen Constraints verstoßen
     * - {@linkcode ZertifizierungExists} falls die ISBN-Nr bereits existiert
     * - {@linkcode TitelExists} falls der Titel bereits existiert
     */
    async create(
        gemaelde: Gemaelde,
    ): Promise<GemaeldeInvalid | TitelExists | ZertifizierungExists | string> {
        logger.debug('GemaeldeService.create(): gemaelde=%o', gemaelde);
        const validateResult = await this.validateCreate(gemaelde);
        if (validateResult instanceof GemaeldeServiceError) {
            return validateResult;
        }

        const gemaeldeModel = new GemaeldeModel(gemaelde);
        const saved = await gemaeldeModel.save();
        const id = saved._id as string; // eslint-disable-line @typescript-eslint/non-nullable-type-assertion-style
        logger.debug('GemaeldeService.create(): id=%s', id);

        await this.sendmail(gemaelde);

        return id;
    }

    /**
     * Ein vorhandenes Gemaelde soll aktualisiert werden.
     * @param gemaelde Das zu aktualisierende Gemaelde
     * @param versionStr Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall
     *  - {@linkcode GemaeldeInvalid}, falls Constraints verletzt sind
     *  - {@linkcode GemaeldeNotExists}, falls das Gemaelde nicht existiert
     *  - {@linkcode TitelExists}, falls der Titel bereits existiert
     *  - {@linkcode VersionInvalid}, falls die Versionsnummer ungültig ist
     *  - {@linkcode VersionOutdated}, falls die Versionsnummer nicht aktuell ist
     */
    async update(
        gemaelde: Gemaelde,
        versionStr: string,
    ): Promise<
        | GemaeldeInvalid
        | GemaeldeNotExists
        | TitelExists
        | VersionInvalid
        | VersionOutdated
        | number
    > {
        logger.debug('GemaeldeService.update(): gemaelde=%o', gemaelde);
        logger.debug('GemaeldeService.update(): versionStr=%s', versionStr);

        const validateResult = await this.validateUpdate(gemaelde, versionStr);
        if (validateResult instanceof GemaeldeServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const gemaeldeModel = new GemaeldeModel(gemaelde);
        // Weitere Methoden zum Aktualisieren:
        //    Gemaelde.findOneAndUpdate(update)
        //    gemaelde.updateOne(bedingung)
        const updated = await GemaeldeModel.findByIdAndUpdate(
            gemaelde._id,
            gemaeldeModel,
            GemaeldeService.UPDATE_OPTIONS,
        ).lean<GemaeldeData | null>();
        if (updated === null) {
            return new GemaeldeNotExists(gemaelde._id);
        }

        const version = updated.__v as number; // eslint-disable-line @typescript-eslint/non-nullable-type-assertion-style
        logger.debug('GemaeldeService.update(): version=%d', version);

        return Promise.resolve(version);
    }

    /**
     * Ein Gemaelde wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Gemaeldees
     * @returns true, falls das Gemaelde vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: string) {
        logger.debug('GemaeldeService.delete(): id=%s', id);

        // Das Gemaelde zur gegebenen ID asynchron loeschen
        const deleted = await GemaeldeModel.findByIdAndDelete(id).lean();
        logger.debug('GemaeldeService.delete(): deleted=%o', deleted);
        return deleted !== null;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Gemaelde.findByIdAndRemove(id)
        //  Gemaelde.findOneAndRemove(bedingung)
    }

    private deleteTimestamps(gemaelde: GemaeldeData) {
        delete gemaelde.createdAt;
        delete gemaelde.updatedAt;
    }

    private async validateCreate(gemaelde: Gemaelde) {
        const msg = validateGemaelde(gemaelde);
        if (msg !== undefined) {
            logger.debug(
                'GemaeldeService.validateCreate(): Validation Message: %o',
                msg,
            );
            return new GemaeldeInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const { titel } = gemaelde;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await GemaeldeModel.exists({ titel })) {
            return new TitelExists(titel);
        }

        const { zertifizierung } = gemaelde;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await GemaeldeModel.exists({ zertifizierung })) {
            return new ZertifizierungExists(zertifizierung);
        }

        logger.debug('GemaeldeService.validateCreate(): ok');
        return undefined;
    }

    private async sendmail(gemaelde: Gemaelde) {
        if (cloud !== undefined || mailConfig.host === 'skip') {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Joe Doe" <Joe.Doe@acme.com>';
        const to = '"Foo Bar" <Foo.Bar@acme.com>';
        const subject = `Neues Gemaelde ${gemaelde._id}`;
        const body = `Das Gemaelde mit dem Titel <strong>${gemaelde.titel}</strong> ist angelegt`;

        const data: SendMailOptions = { from, to, subject, html: body };
        logger.debug('sendMail(): data=%o', data);

        try {
            const nodemailer = await import('nodemailer'); // eslint-disable-line node/no-unsupported-features/es-syntax
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err: unknown) {
            logger.error(
                'GemaeldeService.create(): Fehler beim Verschicken der Email: %o',
                err,
            );
        }
    }

    private async validateUpdate(gemaelde: Gemaelde, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        logger.debug('GemaeldeService.validateUpdate(): version=%d', version);
        logger.debug('GemaeldeService.validateUpdate(): gemaelde=%o', gemaelde);

        const validationMsg = validateGemaelde(gemaelde);
        if (validationMsg !== undefined) {
            return new GemaeldeInvalid(validationMsg);
        }

        const resultTitel = await this.checkTitelExists(gemaelde);
        if (resultTitel !== undefined && resultTitel.id !== gemaelde._id) {
            return resultTitel;
        }

        if (gemaelde._id === undefined) {
            return new GemaeldeNotExists(undefined);
        }

        const resultIdAndVersion = await this.checkIdAndVersion(
            gemaelde._id,
            version,
        );
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        logger.debug('GemaeldeService.validateUpdate(): ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                'GemaeldeService.validateVersion(): VersionInvalid=%o',
                error,
            );
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                'GemaeldeService.validateVersion(): VersionInvalid=%o',
                error,
            );
            return error;
        }

        return version;
    }

    private async checkTitelExists(gemaelde: Gemaelde) {
        const { titel } = gemaelde;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        const result = await GemaeldeModel.findOne(
            { titel },
            { _id: true },
        ).lean();
        if (result !== null) {
            const id = result._id;
            logger.debug('GemaeldeService.checkTitelExists(): _id=%s', id);
            return new TitelExists(titel, id);
        }

        logger.debug('GemaeldeService.checkTitelExists(): ok');
        return undefined;
    }

    private async checkIdAndVersion(id: string, version: number) {
        const gemaeldeDb: GemaeldeData | null = await GemaeldeModel.findById(
            id,
        ).lean();
        if (gemaeldeDb === null) {
            const result = new GemaeldeNotExists(id);
            logger.debug(
                'GemaeldeService.checkIdAndVersion(): GemaeldeNotExists=%o',
                result,
            );
            return result;
        }

        // nullish coalescing
        const versionDb = gemaeldeDb.__v ?? 0;
        if (version < versionDb) {
            const result = new VersionOutdated(id, version);
            logger.debug(
                'GemaeldeService.checkIdAndVersion(): VersionOutdated=%o',
                result,
            );
            return result;
        }

        return undefined;
    }
}
/* eslint-enable no-null/no-null, unicorn/no-useless-undefined, @typescript-eslint/no-unsafe-assignment */
/* eslint-enable max-lines */
