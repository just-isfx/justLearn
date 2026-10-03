import assert from 'node:assert/strict';
import test from 'node:test';
import { extractSpeakableText, combineSpeakableParts } from './speechText.js';
import { normalizeLanguage, clampSpeechRate, DEFAULT_LANGUAGE } from '../services/languageService.js';
import { pickVoice } from './speechEngine.js';

test('extractSpeakableText strips tags and scripts', () => {
    const html = '<h2>Loops</h2><script>alert(1)</script><p>Use a <strong>for</strong> loop.</p>';
    assert.equal(extractSpeakableText(html), 'Loops Use a for loop.');
});

test('extractSpeakableText handles empty content', () => {
    assert.equal(extractSpeakableText(''), '');
    assert.equal(extractSpeakableText(null), '');
    assert.equal(extractSpeakableText('   '), '');
});

test('combineSpeakableParts joins educational copy', () => {
    const text = combineSpeakableParts(['Intro', '<p>Hello world</p>']);
    assert.equal(text, 'Intro. Hello world');
});

test('normalizeLanguage rejects unsupported codes', () => {
    assert.equal(normalizeLanguage('fr'), 'fr');
    assert.equal(normalizeLanguage('es-MX'), 'es');
    assert.equal(normalizeLanguage('de'), DEFAULT_LANGUAGE);
    assert.equal(normalizeLanguage('not-real'), DEFAULT_LANGUAGE);
});

test('clampSpeechRate stays within bounds', () => {
    assert.equal(clampSpeechRate(9), 2);
    assert.equal(clampSpeechRate(0.1), 0.5);
    assert.equal(clampSpeechRate('1.25'), 1.25);
    assert.equal(clampSpeechRate('nope'), 1);
});

test('pickVoice prefers language match then fallback', () => {
    const voices = [
        { lang: 'en-US', voiceURI: 'en', name: 'English' },
        { lang: 'fr-FR', voiceURI: 'fr', name: 'French' },
    ];
    assert.equal(pickVoice(voices, 'fr').voice.voiceURI, 'fr');
    assert.equal(pickVoice(voices, 'es').usedFallback, true);
    assert.equal(pickVoice([], 'en').voice, null);
});
