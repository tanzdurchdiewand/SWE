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

import { HttpMethod, agent, createTestserver } from '../../testserver';
import { HttpStatus, logger, nodeConfig } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import type { Gemaelde } from '../../../src/gemaelde/entity';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import { login } from '../../login';

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
const geaendertesGemaelde: Omit<Gemaelde, 'zertifizierung'> = {
    // zertifizierung wird nicht geaendet
    titel: 'Geaendert',
    art: 'OElGEMAELEDE',
    bewertung: 'B',
    haendler: 'HAENDLER1',
    beschreibung: 'Nicht vorhanden',
    wert: 33.33,
    ausgestellt: true,
    datum: '2016-02-03',
    kuenstler: [{ nachname: 'Gamma', vorname: 'Claus' }],
    kategorien: [],
};
const idVorhanden = '00000000-0000-0000-0000-000000000003';

const geaendertesGemaeldeIdNichtVorhanden: Omit<Gemaelde, 'zertifizierung' > = {
    titel: 'Nichtvorhanden',
    art: 'OElGEMAELEDE',
    haendler: 'HAENDLER1',
    bewertung: 'AAA',
    beschreibung: 'Nicht vorhanden',
    wert: 33.33,
    ausgestellt: true,
    datum: '2016-02-03',
    kuenstler: [{ nachname: 'Gamma', vorname: 'Claus' }],
    kategorien: [],
};
const idNichtVorhanden = '00000000-0000-0000-0000-000000000999';

const geaendertesGemaeldeInvalid: object = {
    titel: 'Alpha',
    art: 'UNSICHTBAR',
    haendler: 'NO_VERLAG',
    wert: 0.01,
    ausgestellt: true,
    datum: '12345-123-123',
    zertifizierung: 'falsche-ISBN',
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
    schlagwoerter: [],
};

const veraltesGemaelde: object = {
    // isgn wird nicht geaendet
    titel: 'Veraltet',
        art: 'OElGEMAELEDE',
    verlag: 'HAENDLER1',
    preis: 33.33,
    lieferbar: true,
    datum: '2016-02-03',
    kuenstler: [{ nachname: 'Gamma', vorname: 'Claus' }],
    kategorien: ['Modern'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
const path = PATHS.gemaelden;
let server: Server;
let gemaeldenUri: string;
let loginUri: string;

// Test-Suite
describe('PUT /api/gemaelden/:id', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${nodeConfig.host}:${address.port}`;
        gemaeldenUri = `${baseUri}${path}`;
        logger.info(`gemaeldenUri = ${gemaeldenUri}`);
        loginUri = `${baseUri}${PATHS.login}`;
    });

    afterAll(() => { server.close() });

    test('Vorhandenes Gemaelde aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesGemaelde);
        const request = new Request(`${gemaeldenUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.NO_CONTENT);
        const responseBody = await response.text();
        expect(responseBody).to.be.empty;
    });

    test('Nicht-vorhandenes Gemaelde aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesGemaeldeIdNichtVorhanden);
        const request = new Request(`${gemaeldenUri}/${idNichtVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal(
            `Es gibt kein Gemaelde mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenes Gemaelde aendern, aber mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesGemaeldeInvalid);
        const request = new Request(`${gemaeldenUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const { art, bewertung, haendler, datum, zertifizierung } = await response.json();
        expect(art).to.be.equal(
            'Die Art eines Gemaeldees muss KINDLE oder DRUCKAUSGABE sein.',
        );
        expect(bewertung).to.be.equal(`Eine Bewertung muss zwischen AAA und C liegen.`);
        expect(haendler).to.be.equal(
            'Der Haendler eines Gemaeldes muss ein HAENDLER1 oder HAENDLER2 sein.',
        );
        expect(datum).to.be.equal('Das Datum muss im Format yyyy-MM-dd sein.');
        expect(zertifizierung).to.be.equal('Die Zertifizierungsnummer ist nicht korrekt.');
    });

    test('Vorhandenes Gemaelde aendern, aber ohne Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(geaendertesGemaelde);
        const request = new Request(`${gemaeldenUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_REQUIRED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal('Versionsnummer fehlt');
    });

    test('Vorhandenes Gemaelde aendern, aber mit alter Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"-1"',
        });
        const body = JSON.stringify(veraltesGemaelde);
        const request = new Request(`${gemaeldenUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.have.string('Die Versionsnummer');
    });

    test('Vorhandenes Gemaelde aendern, aber ohne Token', async () => {
        // given
        const headers = new Headers({
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesGemaelde);
        const request = new Request(`${gemaeldenUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });

    test('Vorhandenes Gemaelde aendern, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesGemaelde);
        const request = new Request(`${gemaeldenUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });
});
