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
import { HttpStatus, nodeConfig } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import type { Gemaelde } from '../../../src/gemaelde/entity';
import { PATHS } from '../../../src/app';
import RE2 from 're2';
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
const neuesGemaelde: Gemaelde = {
    titel: 'Neu',
    beschreibung: 'Schönes Bild',
    art: 'SIEBDRUCK',
    haendler: 'HAENDLER1',
    bewertung: 'AAA',
    wert: 99.99,
    ausgestellt: true,
    datum: '2016-02-28',
    zertifizierung: '0-0070-0644-6',
    kategorien: ['Modern'],
    kuenstler: [{ nachname: 'Test', vorname: 'Theo' }],
};
const neuesGemaeldeInvalid: object = {
    titel: 'Blabla',
    beschreibung: true,
    art: 'UNSICHTBAR',
    haendler: 'NO_VERLAG',
    wert: -5,
    ausgestellt: true,
    datum: '12345-123-123',
    zertifizierung: 'falsche-ISGN',
    kuenstler: [{ nachname: 'Test', vorname: 'Theo' }],
    kategorien: [],
};
const neuesGemaeldeTitelExistiert: Gemaelde = {
    titel: 'DerSchrei',
    beschreibung: "Schön",
    art: 'OElGEMAELEDE',
    haendler: 'HAENDLER1',
    bewertung: 'AAA',
    wert: 99.99,
    ausgestellt: true,
    datum: '2016-02-28',
    zertifizierung: '3897225831',
    kuenstler: [{ nachname: 'Munch', vorname: 'Edvard' }],
    kategorien: ['Expressionismus'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.gemaelden;
let gemaeldenUri: string;
let loginUri: string;

// Test-Suite
describe('POST /api/gemaelden', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${nodeConfig.host}:${address.port}`;
        gemaeldenUri = `${baseUri}${path}`;
        loginUri = `${baseUri}${PATHS.login}`;
    });

    // (done?: DoneFn) => Promise<void | undefined | unknown> | void | undefined
    // close(callback?: (err?: Error) => void): this
    afterAll(() => { server.close() });

    test('Neues Gemaelde', async () => {
        // given
        const token = await login(loginUri);

        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesGemaelde);
        const request = new Request(gemaeldenUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });
        const uuidRegexp = new RE2(
            '[\\dA-Fa-f]{8}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{12}',
            'u',
        );

        // when
        const response = await fetch(request);

        // then
        const { status } = response;
        expect(status).to.be.equal(HttpStatus.CREATED);

        const location = response.headers.get('Location');
        expect(location).to.exist;
        expect(typeof location === 'string').to.be.true;
        expect(location).not.to.be.empty;

        // UUID: Muster von HEX-Ziffern
        const indexLastSlash: number = location?.lastIndexOf('/') as number;
        const idStr = location?.slice(indexLastSlash + 1);
        expect(idStr).not.to.be.empty;
        expect(uuidRegexp.test(idStr as string)).to.be.true;

        const responseBody = response.text();
        expect(responseBody).to.be.empty;
    });

    test('Neues Gemaelde mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesGemaeldeInvalid);
        const request = new Request(gemaeldenUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const { art, rating, verlag, datum, isbn } = await response.json();

        expect(art).to.be.equal(
            'Die Art eines Gemaeldes muss KINDLE oder DRUCKAUSGABE sein.',
        );
        expect(rating).to.be.equal('Eine Bewertung muss zwischen 0 und 5 liegen.');
        expect(verlag).to.be.equal(
            'Der Verlag eines Gemaeldes muss FOO_VERLAG oder BAR_VERLAG sein.',
        );
        expect(datum).to.be.equal('Das Datum muss im Format yyyy-MM-dd sein.');
        expect(isbn).to.be.equal('Die ISBN-Nummer ist nicht korrekt.');
    });

    test('Neues Gemaelde, aber der Titel existiert bereits', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesGemaeldeTitelExistiert);
        const request = new Request(gemaeldenUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const responseBody = await response.text();
        expect(responseBody).has.string('Titel');
    });

    test('Neues Gemaelde, aber ohne Token', async () => {
        // given
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const body = JSON.stringify(neuesGemaeldeTitelExistiert);
        const request = new Request(gemaeldenUri, {
            method: HttpMethod.POST,
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

    test('Neues Gemaelde, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesGemaelde);
        const request = new Request(gemaeldenUri, {
            method: HttpMethod.POST,
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

    test.todo('Test mit abgelaufenem Token');
});
