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
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Büchern, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/* eslint-disable max-classes-per-file */

import type { ValidationErrorMsg } from './../entity';

/**
 * Allgemeine Basisklasse für {@linkcode GemaeldeService}
 */
export class GemaeldeServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

/**
 * Klasse für fehlerhafte Gemaeldedaten. Die Meldungstexte sind in der Property
 * `msg` gekapselt.
 */
export class GemaeldeInvalid extends GemaeldeServiceError {
    constructor(readonly msg: ValidationErrorMsg) {
        super();
    }
}

/**
 * Klasse für einen bereits existierenden Titel.
 */
export class TitelExists extends GemaeldeServiceError {
    constructor(
        readonly titel: string | null | undefined,
        readonly id?: string,
    ) {
        super();
    }
}

/**
 * Klasse für eine bereits existierende ISBN-Nummer.
 */
export class ZertifizierungExists extends GemaeldeServiceError {
    constructor(
        readonly isbn: string | null | undefined,
        readonly id?: string,
    ) {
        super();
    }
}

/**
 * Union-Type für Fehler beim Neuanlegen eines Gemaeldees.
 */
export type CreateError = GemaeldeInvalid | TitelExists | ZertifizierungExists;

/**
 * Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export class VersionInvalid extends GemaeldeServiceError {
    constructor(readonly version: string | undefined) {
        super();
    }
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export class VersionOutdated extends GemaeldeServiceError {
    constructor(readonly id: string, readonly version: number) {
        super();
    }
}

/**
 * Klasse für ein nicht-vorhandenes Gemaelde beim Ändern.
 */
export class GemaeldeNotExists extends GemaeldeServiceError {
    constructor(readonly id: string | undefined) {
        super();
    }
}

/**
 * Union-Type für Fehler beim Ändern eines Gemaeldees.
 */
export type UpdateError =
    | GemaeldeInvalid
    | GemaeldeNotExists
    | TitelExists
    | VersionInvalid
    | VersionOutdated;

/**
 * Allgemeine Basisklasse für {@linkcode GemaeldeFileService}
 */
export class GemaeldeFileServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

/**
 * Klasse für eine nicht-vorhandenes Binärdatei.
 */
export class FileNotFound extends GemaeldeFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

/**
 * Klasse, falls es mehrere Binärdateien zu einem Gemaelde gibt.
 */
export class MultipleFiles extends GemaeldeFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

/**
 * Union-Type für Fehler beim Lesen eines Gemaeldees.
 */
export type DownloadError = FileNotFound | GemaeldeNotExists | MultipleFiles;

/* eslint-enable max-classes-per-file */
