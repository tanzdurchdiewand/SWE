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
 * Das Modul enthält die _Typdefinitionen_ für GraphQL, die mit einem _Tagged
 * Template String_ für Apollo realisiert sind.
 *
 * Vordefinierte skalare Typen
 * - Int: 32‐bit Integer
 * - Float: Gleitkommmazahl mit doppelter Genauigkeit
 * - String:
 * - Boolean: true, false
 * - ID: eindeutiger Bezeichner, wird serialisiert wie ein String
 *
 * `Buch`: eigene Typdefinition für Queries. `!` markiert Pflichtfelder
 *
 * `Query`: Signatur der Lese-Methoden
 *
 * `Mutation`: Signatur der Schreib-Methoden
 * @packageDocumentation
 */

import { gql } from 'apollo-server-express';

// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#the-gql-tag
// https://www.apollographql.com/docs/apollo-server/schema/schema

/**
 * _Tagged Template String_, d.h. der Template-String wird durch eine Funktion
 * (hier: `gql`) modifiziert. Die Funktion `gql` wird für Syntax-Highlighting
 * und für die Formatierung durch Prettier verwendet.
 */
export const typeDefs = gql`
    "Enum-Typ fuer die Art eines Gemäldes"
    enum GemaeldeArt {
        OElGEMAELEDE
        SIEBDRUCK
        WASSERFARBENGEMAELDE
    }

    "Enum-Typ fuer den Verlag eines Gemäldes"
    enum Haendler {
        BAR_HAENDLER
        FOO_HAENDLER
    }

    "Enum-Typ fuer den Verlag eines Gemäldes"
    enum Bewertung {
        A
        AA
        AAA
        B
        C
    }
    "Datenschema eines Gemäldes, das empfangen oder gesendet wird"
    type Gemaelde {
        id: ID!
        version: Int
        titel: String!
        beschreibung: String
        bewertung: Bewertung
        art: GemaeldeArt
        haendler: Haendler!
        wert: Float
        ausgestellt: Boolean
        datum: String
        zertifizierung: String
        kategorien: [String]
    }

    "Funktionen, um Buecher zu empfangen"
    type Query {
        gemaelden(titel: String): [Gemaelde]
        gemaelde(id: ID!): Gemaelde
    }

    "Funktionen, um Buecher anzulegen, zu aktualisieren oder zu loeschen"
    type Mutation {
        createGemaelde(
            titel: String!
            beschreibung: String
            bewertung: String
            art: String
            haendler: String!
            wert: Float
            ausgestellt: Boolean
            datum: String
            zertifizierung: String
            kategorien: [String]
        ): String
        updateGemaelde(
            _id: ID
            titel: String!
            beschreibung: String
            bewertung: String
            art: String
            haendler: String!
            wert: Float
            ausgestellt: Boolean
            datum: String
            zertifizierung: String
            kategorien: [String]
            version: Int
        ): Int
        deleteGemaelde(id: ID!): Boolean
    }
`;
