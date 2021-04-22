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
 * Das Modul besteht aus dem Schema und Model für _Mongoose_.
 * @packageDocumentation
 */

import type { Bewertung, Gemaelde, GemaeldeArt, Haendler } from './gemaelde';
import { Document, Schema, SchemaType, model } from 'mongoose';
import { autoIndex, logColorConsole } from '../../shared';
import type { Model } from 'mongoose';
// RFC version 1: timestamps            https://github.com/uuidjs/uuid#uuidv1options-buffer-offset
// RFC version 3: namespace mit MD5     https://github.com/uuidjs/uuid#uuidv3name-namespace-buffer-offset
// RFC version 4: random                https://github.com/uuidjs/uuid#uuidv4options-buffer-offset
// RFC version 5: namespace mit SHA-1   https://github.com/uuidjs/uuid#uuidv5name-namespace-buffer-offset
import { v4 as uuid } from 'uuid';

if (logColorConsole) {
    SchemaType.set('debug', true);
}

// Mongoose ist von Valeri Karpov, der auch den Begriff "MEAN-Stack" gepraegt hat:
// http://thecodebarbarian.com/2013/04/29//easy-web-prototyping-with-mongodb-and-nodejs

/**
 * Document-Klasse für _Mongoose_ mit `_id` vom Typ `string` und passend zum
 * Interface {@linkcode Gemaelde}
 */
export class GemaeldeDocument extends Document<string> implements Gemaelde {
    readonly titel: string | null | undefined;

    readonly beschreibung: string | null | undefined;

    readonly bewertung: Bewertung | null | undefined;

    readonly art: GemaeldeArt | '' | null | undefined;

    readonly haendler: Haendler | '' | null | undefined;

    readonly wert: number | undefined;

    readonly ausgestellt: boolean | undefined;

    readonly datum: Date | string | undefined;

    readonly zertifizierung: string | null | undefined;

    readonly kategorien?: string[];

    readonly kuenstler: unknown;

    readonly createdAt?: number;

    readonly updatedAt?: number;
}

// Ein Schema in Mongoose definiert die Struktur und Methoden fuer die
// Dokumente in einer Collection, die aus Dokumenten im BSON-Format besteht.
// Ein Property im Schema definiert eine Property fuer jedes Dokument.
// Ein Schematyp (String, Number, Boolean, Date, Array, ObjectId) legt den Typ
// der Property fest.

// https://mongoosejs.com/docs/schematypes.html
/**
 * Das Schema für Mongoose, das dem Schema bei einem relationalen DB-System
 * entspricht, welches durch `CREATE TABLE`, `CREATE INDEX` usw. entsteht.
 */
export const gemaeldeSchema = new Schema<
    GemaeldeDocument,
    Model<GemaeldeDocument>
>(
    {
        // MongoDB erstellt implizit einen Index fuer _id
        // mongoose-id-assigner hat geringe Download-Zahlen und
        // uuid-mongodb hat keine Typ-Definitionen fuer TypeScript
        _id: { type: String, default: uuid },
        titel: { type: String, required: true, unique: true },
        beschreibung: { type: String, required: true },
        bewertung: { type: String, enum: ['AAA', 'AA', 'A', 'B', 'C'] },
        art: {
            type: String,
            enum: ['OElGEMAELEDE', 'SIEBDRUCK', 'WASSERFARBENGEMAELDE'],
        },
        haendler: {
            type: String,
            required: true,
            enum: ['FOO_HAENDLER', 'BAR_HAENDLER'],
            // es gibt auch
            //  lowercase: true
            //  uppercase: true
        },
        wert: { type: Number, required: true },
        ausgestellt: Boolean,
        datum: Date,
        isbn: { type: String, required: true, unique: true, immutable: true },
        kategorien: { type: [String], sparse: true },
        // "anything goes"
        kuenstler: [{}],
    },
    {
        // default: virtueller getter "id"
        // id: true,

        // createdAt und updatedAt als automatisch gepflegte Felder
        timestamps: true,
        // http://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html
        optimisticConcurrency: true,
        autoIndex,
    },
);

// Optimistische Synchronisation durch das Feld __v fuer die Versionsnummer
// https://mongoosejs.com/docs/guide.html#versionKey
// https://github.com/Automattic/mongoose/issues/1265
const optimistic = (
    schema: Schema<GemaeldeDocument, Model<GemaeldeDocument>>,
) => {
    schema.pre('findOneAndUpdate', function () {
        // UpdateQuery ist abgeleitet von ReadonlyPartial<Schema<...>>
        const update = this.getUpdate(); // eslint-disable-line @typescript-eslint/no-invalid-this
        // eslint-disable-next-line no-null/no-null
        if (update === null) {
            return;
        }
        // eslint-disable-next-line no-null/no-null
        if (update.__v !== null) {
            // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
            delete update.__v;
        }
        const keys = ['$set', '$setOnInsert'];
        for (const key of keys) {
            // Optional Chaining
            /* eslint-disable security/detect-object-injection */
            // eslint-disable-next-line no-null/no-null
            if (update[key]?.__v !== null) {
                delete update[key].__v;
                if (Object.entries(update[key]).length === 0) {
                    // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
                    delete update[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
                }
            }
            /* eslint-enable security/detect-object-injection */
        }
        update.$inc = update.$inc || {};
        // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
        update.$inc.__v = 1;
    });
};

gemaeldeSchema.plugin(optimistic);

/**
 * Ein Model ist ein übersetztes Schema und stellt die CRUD-Operationen für
 * die Dokumente bereit, d.h. das Pattern _Active Record_ wird realisiert.
 * Der Name des Models wird als Name für die Collection in MongoDB verwendet.
 */
export const GemaeldeModel = model<GemaeldeDocument>( // eslint-disable-line @typescript-eslint/naming-convention
    'Gemaelde',
    gemaeldeSchema,
);
