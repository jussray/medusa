import test from 'node:test';
import assert from 'node:assert/strict';
import {accountSection} from './onboarding.mjs';
test('signup explains steps and links to verification',()=>{const html=accountSection('signup',false);assert.match(html,/Step 1 of 3/);assert.match(html,/href="\/auth\/verify-account"/);assert.doesNotMatch(html,/<form|\/app\.js/)});
test('verification never exposes a working provider link when unconfigured',()=>{const html=accountSection('verify',false);assert.match(html,/Step 2 of 3/);assert.match(html,/disabled/);assert.doesNotMatch(html,/href="\/auth\/google\/start/)});
test('configured verification initiates signup through Google',()=>{assert.match(accountSection('verify',true),/href="\/auth\/google\/start\?intent=signup"/);assert.match(accountSection('signin',true),/href="\/auth\/google\/start"/)});
test('unconfigured login is explicit and has no credential fields',()=>{const html=accountSection('signin',false);assert.match(html,/disabled/);assert.doesNotMatch(html,/<input|<form/)});
