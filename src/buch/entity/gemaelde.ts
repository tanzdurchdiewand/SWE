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
 * Das Modul besteht aus dem Interface {@linkcode GemaeldeData} und der Klasse
 * {@linkcode GemaeldeDocument} für Mongoose. Aus dem Interface {@linkcode GemaeldeData}
 * ist das Interface {@linkcode Gemaelde} extrahiert, das an der REST- und
 * GraphQL-Schnittstelle verwendet wird.
 * @packageDocumentation
 */

/**
 * Alias-Typ für gültige Strings bei Verlagen.
 */
export type Haendler = 'BAR_HAENDLER' | 'FOO_HAENDLER';

/**
 * Alias-Typ für gültige Strings bei Verlagen.
 */
export type Bewertung = 'AAA' | 'AA' | 'A' | 'B' | 'C';

/**
 * Alias-Typ für gültige Strings bei der Art eines Gemaelde.
 */
export type GemaeldeArt = 'OElGEMAELEDE' | 'SIEBDRUCK' | 'WASSERFARBENGEMAELDE';

/**
 * Gemeinsames Interface für _REST_, _GraphQL_ und _Mongoose_.
 */
export interface Gemaelde {
    // _id und __v werden bei REST durch HATEOAS und ETag abgedeckt
    // und deshalb beim Response entfernt.
    // Ausserdem wird _id bei einem POST-Request generiert
    _id?: string; // eslint-disable-line @typescript-eslint/naming-convention

    __v?: number; // eslint-disable-line @typescript-eslint/naming-convention

    readonly titel: string | null | undefined;
    readonly beschreibung: string | null | undefined;
    readonly bewertung: Bewertung | null | undefined;
    readonly art: GemaeldeArt | '' | null | undefined;
    readonly haendler: Haendler | '' | null | undefined;
    readonly wert: number | undefined;
    readonly ausgestaelt: boolean | undefined;

    // string bei REST und Date bei GraphQL sowie Mongoose
    datum: Date | string | undefined;

    readonly zertifizierung: string | null | undefined;
    readonly kategorien?: string[];
    readonly kuenstler: unknown;
}

/**
 * Interface für die Rohdaten aus MongoDB durch die _Mongoose_-Funktion `lean()`.
 */
export interface GemaeldeData extends Gemaelde {
    // Zeitstempel fuer die MongoDB-Dokumente:
    // wird bei der Rueckgabe aus dem Anwendungskern entfernt
    createdAt?: Date;

    updatedAt?: Date;
}
