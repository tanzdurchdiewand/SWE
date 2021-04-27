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

import { HttpStatus, nodeConfig } from '../../../src/shared';
import { agent, createTestserver } from '../../testserver';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import type { AddressInfo } from 'net';
import type { Gemaelde } from '../../../src/gemaelde/entity';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import each from 'jest-each';
import fetch from 'node-fetch';

const { expect } = chai;

// IIFE (= Immediately Invoked Function Expression) statt top-level await
// https://developer.mozilla.org/en-US/docs/Glossary/IIFE
(async () => {
    // startWith(), endWith()
    const chaiString = await import('chai-string');
    chai.use(chaiString.default);
})();

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const titelVorhanden = ['s', 'm', 'a','b','c'];
const titelNichtVorhanden = ['xx', 'yy'];
//const kategorienVorhanden = ['Expressionismus', 'Modern','Renaissance'];
const kategorienNichtVorhanden = ['Skizze', 'Comic'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.gemaelden;
let gemaeldenUri: string;

// Test-Suite
describe('GET /api/gemaelden', () => {
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        gemaeldenUri = `https://${nodeConfig.host}:${address.port}${path}`;
    });

    afterAll(() => { server.close() });

    test('Alle Gemälde', async () => {
        // given

        // when
        const response = await fetch(gemaeldenUri, { agent });

        // then
        const { status, headers } = response;
        expect(status).to.be.equal(HttpStatus.OK);
        expect(headers.get('Content-Type')).to.match(/json/iu);
        // https://jestjs.io/docs/en/expect
        // JSON-Array mit mind. 1 JSON-Objekt
        const gemaelden: Array<any> = await response.json();
        expect(gemaelden).not.to.be.empty;
        gemaelden.forEach((gemaelde) => {
            const selfLink = gemaelde._links.self.href;
            expect(selfLink).to.have.string(path);
        });
    });

    each(titelVorhanden).test(
        'Gemälde mit einem Titel, der "%s" enthaelt',
        async (teilTitel) => {
            // given
            const uri = `${gemaeldenUri}?titel=${teilTitel}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            const { status, headers } = response;
            expect(status).to.be.equal(HttpStatus.OK);
            expect(headers.get('Content-Type')).to.match(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            const body = await response.json();
            expect(body).not.to.be.empty;

            // Jedes Gemaelde hat einen Titel mit dem Teilstring 'a'
            body.map((gemaelde: Gemaelde) => gemaelde.titel).forEach((titel: string) =>
                expect(titel.toLowerCase()).to.have.string(teilTitel),
            );
        },
    );

    each(titelNichtVorhanden).test(
        'Keine Gemälde mit einem Titel, der "%s" nicht enthaelt',
        async (teilTitel) => {
            // given
            const uri = `${gemaeldenUri}?titel=${teilTitel}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );



    // each(kategorienVorhanden).test(
    //     'Mind. 1 Gemaelde mit der Kategorie "%s"',
    //     async (kategorie) => {
    //         // given
    //         const uri = `${gemaeldenUri}?${kategorie}=true`;

    //         // when
    //         const response = await fetch(uri, { agent });

    //         // then
    //         const { status, headers } = response;
    //         expect(status).to.be.equal(HttpStatus.OK);
    //         expect(headers.get('Content-Type')).to.match(/json/iu);
    //         // JSON-Array mit mind. 1 JSON-Objekt
    //         const body = await response.json();
    //         expect(body).not.to.be.empty;

    //         // Jedes Gemaelde hat im Array die Kategorie "%s"
    //         body.map(
    //             (gemaelde: Gemaelde) => gemaelde.kategorien,
    //         ).forEach((s: Array<string>) =>
    //             expect(s).to.include(kategorie),
    //         );
    //     },
    // );

    each(kategorienNichtVorhanden).test(
        'Keine Gemälde mit der Kategorie "%s"',
        async (kategorie) => {
            // given
            const uri = `${gemaeldenUri}?${kategorie}=true`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );
});
