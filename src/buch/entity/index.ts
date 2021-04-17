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
 * Das Modul besteht aus Interfaces, Klassen und Funktionen für Gemaelde als
 * _Entity_ gemäß _Domain Driven Design_. Dazu gehört auch die Validierung.
 * @packageDocumentation
 */

<<<<<<< HEAD
export { Buch, BuchArt, BuchData, Verlag } from './gemaelde';
export { BuchDocument, BuchModel, buchSchema } from './gemaelde.model';
export { MAX_RATING } from './jsonSchema';
export { ValidationErrorMsg, validateBuch } from './validateBuch';
=======
export { Gemaelde, GemaeldeArt, GemaeldeData, Haendler } from './gemaelde';
export { GemaeldeDocument, GemaeldeModel, gemaeldeSchema } from './gemaelde.model';
export { ValidationErrorMsg, validateGemaelde } from './validateGemaelde';
>>>>>>> 51ba9a52ab0be83b4ab3f75983a0b9ba77b26d52
