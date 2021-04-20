/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul enthält Funktionen für den DB-Zugriff einschließlich GridFS und
 * Neuladen der Test-DB.
 * @packageDocumentation
 */

import type { GemaeldeData } from '../../gemaelde/entity';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Die Testdaten, um die Test-DB neu zu laden, als JSON-Array.
 */
export const testdaten: GemaeldeData[] = [
    {
        _id: '00000000-0000-0000-0000-000000000001',
        titel: 'Alpha',
        art: 'OElGEMAELEDE',
        haendler: 'BAR_HAENDLER',
        bewertung : 'AAA',
        wert: 11.1,
        ausgestellt: true,
        beschreibung:"Schön",
        // https://docs.mongodb.com/manual/reference/method/Date
        datum: new Date('2020-02-01'),
        zertifizierung: '978-3897225831',
        //kategorie: ['OELGEMAELDE'],
        kuenstler: [
            {
                nachname: 'Beta',
                vorname: 'Bert',
            },
            {
                nachname: 'Alpha',
                vorname: 'Alfred',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000002',
        titel: 'Alpha',
        art: 'OElGEMAELEDE',
        haendler: 'BAR_HAENDLER',
        bewertung : 'AAA',
        wert: 11.1,
        ausgestellt: true,
        beschreibung:"Schön",
        // https://docs.mongodb.com/manual/reference/method/Date
        datum: new Date('2020-02-01'),
        zertifizierung: '978-3897225831',
        //kategorie: ['OELGEMAELDE'], 
        kuenstler: [
            {
                nachname: 'Alpha',
                vorname: 'Adriana',
            },
            {
                nachname: 'Alpha',
                vorname: 'Alfred',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-00000000003',
        titel: 'DerSchrei',
        art: 'OElGEMAELEDE',
        haendler: 'BAR_HAENDLER',
        bewertung : 'AAA',
        wert: 99.9,
        ausgestellt: true,
        beschreibung:"Schön",
        // https://docs.mongodb.com/manual/reference/method/Date
        datum: new Date('2020-02-01'),
        zertifizierung: '978-3897225831',
        kategorien: [' Expressionismus'],
        kuenstler: [
            {
                nachname: 'Edvard',
                vorname: 'Munch',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000004',
        titel: 'Alpha',
        art: 'OElGEMAELEDE',
        haendler: 'BAR_HAENDLER',
        bewertung : 'AAA',
        wert: 11.1,
        ausgestellt: true,
        beschreibung:"Schön",
        // https://docs.mongodb.com/manual/reference/method/Date
        datum: new Date('2020-02-01'),
        zertifizierung: '978-3897225831',
        kategorien: ['Modern'],
        kuenstler: [
            {
                nachname: 'Alpha',
                vorname: 'Adriana',
            },
            {
                nachname: 'Alpha',
                vorname: 'Alfred',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000005',
        titel: 'Alpha',
        art: 'OElGEMAELEDE',
        haendler: 'BAR_HAENDLER',
        bewertung : 'AAA',
        wert: 11.1,
        ausgestellt: true,
        beschreibung:"Schön",
        // https://docs.mongodb.com/manual/reference/method/Date
        datum: new Date('2020-02-01'),
        zertifizierung: '978-3897225831',
        kategorien: ['Abstrakt', 'Bunt'],
        kuenstler: [
            {
                nachname: 'Alpha',
                vorname: 'Adriana',
            },
            {
                nachname: 'Alpha',
                vorname: 'Alfred',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
Object.freeze(testdaten);

/* eslint-enable @typescript-eslint/naming-convention */
