/*
 * Copyright (C) 2018 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul enthält die _Resolver_ für GraphQL.
 *
 * Die Referenzimplementierung von GraphQL soll übrigens nach TypeScript
 * migriert werden: https://github.com/graphql/graphql-js/issues/2860
 * @packageDocumentation
 */

import {
    GemaeldeInvalid,
    GemaeldeNotExists,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from '../service/errors';
import { GemaeldeService, GemaeldeServiceError } from '../service';
import type { Gemaelde } from '../entity';
import { logger } from '../../shared';

const gemaeldeService = new GemaeldeService();

// https://www.apollographql.com/docs/apollo-server/data/resolvers
// Zugriff auf Header-Daten, z.B. Token
// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#accessing-request-headers
// https://www.apollographql.com/docs/apollo-server/security/authentication

// Resultat mit id (statt _id) und version (statt __v)
// __ ist bei GraphQL fuer interne Zwecke reserviert
const withIdAndVersion = (gemaelde: Gemaelde) => {
    const result: any = gemaelde;
    result.id = gemaelde._id;
    result.version = gemaelde.__v;
    return gemaelde;
};

const findGemaeldeById = async (id: string) => {
    const gemaelde = await gemaeldeService.findById(id);
    if (gemaelde === undefined) {
        return;
    }
    return withIdAndVersion(gemaelde);
};

const findGemaelden = async (titel: string | undefined) => {
    const suchkriterium = titel === undefined ? {} : { titel };
    const gemaelden = await gemaeldeService.find(suchkriterium);
    return gemaelden.map((gemaelde: Gemaelde) => withIdAndVersion(gemaelde));
};

interface TitelCriteria {
    titel: string;
}

interface IdCriteria {
    id: string;
}

const createGemaelde = async (gemaelde: Gemaelde) => {
    gemaelde.datum = new Date(gemaelde.datum as string);
    const result = await gemaeldeService.create(gemaelde);
    logger.debug('resolvers createGemaelde(): result=%o', result);
    if (result instanceof GemaeldeServiceError) {
        return;
    }
    return result;
};

const logUpdateResult = (
    result:
        | GemaeldeInvalid
        | GemaeldeNotExists
        | TitelExists
        | VersionInvalid
        | VersionOutdated
        | number,
) => {
    if (result instanceof GemaeldeInvalid) {
        logger.debug(
            'resolvers updateGemaelde(): validation msg = %o',
            result.msg,
        );
    } else if (result instanceof TitelExists) {
        logger.debug(
            'resolvers updateGemaelde(): vorhandener titel = %s',
            result.titel,
        );
    } else if (result instanceof GemaeldeNotExists) {
        logger.debug(
            'resolvers updateGemaelde(): nicht-vorhandene id = %s',
            result.id,
        );
    } else if (result instanceof VersionInvalid) {
        logger.debug(
            'resolvers updateGemaelde(): ungueltige version = %d',
            result.version,
        );
    } else if (result instanceof VersionOutdated) {
        logger.debug(
            'resolvers updateGemaelde(): alte version = %d',
            result.version,
        );
    } else {
        logger.debug(
            'resolvers updateGemaelde(): aktualisierte Version= %d',
            result,
        );
    }
};

const updateGemaelde = async (gemaelde: Gemaelde) => {
    logger.debug(
        'resolvers updateGemaelde(): zu aktualisieren = %s',
        JSON.stringify(gemaelde),
    );
    const version = gemaelde.__v ?? 0;
    gemaelde.datum = new Date(gemaelde.datum as string);
    const result = await gemaeldeService.update(gemaelde, version.toString());
    logUpdateResult(result);
    return result;
};

const deleteGemaelde = async (id: string) => {
    const result = await gemaeldeService.delete(id);
    logger.debug('resolvers deleteGemaelde(): result = %s', result);
    return result;
};

// Queries passend zu "type Query" in typeDefs.ts
const query = {
    /**
     * Bücher suchen
     * @param _ nicht benutzt
     * @param __namedParameters JSON-Objekt mit `titel` als Suchkriterium
     * @returns Promise mit einem JSON-Array der gefundenen Bücher
     */
    gemaelden: (_: unknown, { titel }: TitelCriteria) => findGemaelden(titel),

    /**
     * Gemaelde suchen
     * @param _ nicht benutzt
     * @param __namedParameters JSON-Objekt mit `id` als Suchkriterium
     * @returns Promise mit dem gefundenen {@linkcode Gemaelde} oder `undefined`
     */
    gemaelde: (_: unknown, { id }: IdCriteria) => findGemaeldeById(id),
};

const mutation = {
    /**
     * Neues Gemaelde anlegen
     * @param _ nicht benutzt
     * @param gemaelde JSON-Objekt mit dem neuen {@linkcode Gemaelde}
     * @returns Promise mit der generierten ID
     */
    createGemaelde: (_: unknown, gemaelde: Gemaelde) =>
        createGemaelde(gemaelde),

    /**
     * Vorhandenes {@linkcode Gemaelde} aktualisieren
     * @param _ nicht benutzt
     * @param gemaelde JSON-Objekt mit dem zu aktualisierenden Gemaelde
     * @returns Das aktualisierte Gemaelde als {@linkcode GemaeldeData} in einem Promise,
     * falls kein Fehler aufgetreten ist. Ansonsten ein Promise mit einem Fehler
     * durch:
     * - {@linkcode GemaeldeInvalid}
     * - {@linkcode GemaeldeNotExists}
     * - {@linkcode TitelExists}
     * - {@linkcode VersionInvalid}
     * - {@linkcode VersionOutdated}
     */
    updateGemaelde: (_: unknown, gemaelde: Gemaelde) =>
        updateGemaelde(gemaelde),

    /**
     * Gemaelde löschen
     * @param _ nicht benutzt
     * @param __namedParameters JSON-Objekt mit `id` zur Identifikation
     * @returns true, falls das Gemaelde gelöscht wurde. Sonst false.
     */
    deleteGemaelde: (_: unknown, { id }: IdCriteria) => deleteGemaelde(id),
};

/**
 * Die Resolver bestehen aus `Query` und `Mutation`.
 */
export const resolvers /* : IResolvers */ = {
    Query: query, // eslint-disable-line @typescript-eslint/naming-convention
    Mutation: mutation, // eslint-disable-line @typescript-eslint/naming-convention
};
