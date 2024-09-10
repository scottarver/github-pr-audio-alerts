// ==UserScript==
// @name         GitHub PR Comment, Merge Status, and PR Status Alert
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Play dynamic sounds with PR signature for new comments, merge status changes, and PR status changes on GitHub pull request pages
// @match        https://github.com/*/pull/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    function isPullRequestPage() {
        return window.location.pathname.includes('/pull/');
    }

    function getPullRequestNumber() {
        const match = window.location.pathname.match(/\/pull\/(\d+)/);
        return match ? match[1] : null;
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    function playTone(frequency, duration, startTime, type = 'sine') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    function playSequentialTones(prFrequency, eventFrequency, eventDuration, eventType) {
        const now = audioContext.currentTime;
        const prDuration = 0.2; // Fixed duration for PR signature tone

        playTone(prFrequency, prDuration, now, 'sine');
        playTone(eventFrequency, eventDuration, now + prDuration, eventType);

        console.log(`Playing PR signature: ${prFrequency}Hz, followed by event sound: ${eventFrequency}Hz, ${eventDuration}s, ${eventType}`);
    }

    function getPRSignatureFrequency() {
        const prNumber = getPullRequestNumber();
        if (!prNumber) return 440; // Default to A4 if PR number can't be found

        const hash = hashCode(prNumber);
        return 220 + (Math.abs(hash) % 880); // Range: 220Hz (A3) to 1100Hz (C6)
    }

    function playHappyChord() {
        const now = audioContext.currentTime;
        const duration = 1.0;

        // Play a major chord (C, E, G)
        playTone(261.63, duration, now, 'sine'); // C4
        playTone(329.63, duration, now, 'sine'); // E4
        playTone(392.00, duration, now, 'sine'); // G4

        console.log('Playing happy chord for successful build and deploy');
    }

    function playSoundForNewComment(commentElement) {
        const commentText = commentElement.textContent.toLowerCase();
        if (commentText.includes("pr is build and deployed:")) {
            playHappyChord();
        } else {
            const elementSize = commentElement.innerHTML.length;
            const eventFrequency = 200 + (elementSize % 1800);
            const eventDuration = 0.1 + (elementSize % 2000) / 1000;
            playSequentialTones(getPRSignatureFrequency(), eventFrequency, eventDuration, 'sine');
        }
    }

    function playKlaxonAlarm(startTime, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, startTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);

        const lfoFrequency = 4; // Number of oscillations per second
        for (let i = 0; i < duration * lfoFrequency; i++) {
            const t = i / lfoFrequency;
            oscillator.frequency.setValueAtTime(440, startTime + t);
            oscillator.frequency.linearRampToValueAtTime(880, startTime + t + 1 / (2 * lfoFrequency));
            oscillator.frequency.setValueAtTime(880, startTime + t + 1 / lfoFrequency);
        }

        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    function playSoundForMergeStatusChange(statusItem, isNewItem) {
        let eventFrequency, eventDuration, eventType;
        const statusText = statusItem.textContent.trim().toLowerCase();
        console.log({ statusText });
        if (isNewItem) {
            eventFrequency = 440; // A4 note
            eventDuration = 0.3;
            eventType = 'square';
        } else if (statusText.includes('success')) {
            eventFrequency = 523.25; // C5 note
            eventDuration = 0.5;
            eventType = 'sine';
        } else if (statusText.includes('failure') || statusText.includes('error') || statusText.includes('failing')) {
            // Play klaxon alarm for failed status
            const now = audioContext.currentTime;
            const prFrequency = getPRSignatureFrequency();
            const prDuration = 0.2;

            playTone(prFrequency, prDuration, now, 'sine');
            playKlaxonAlarm(now + prDuration, 1.5);
            console.log(`Playing PR signature: ${prFrequency}Hz, followed by klaxon alarm`);
            return;
        } else {
            eventFrequency = 349.23; // F4 note
            eventDuration = 0.2;
            eventType = 'triangle';
        }

        playSequentialTones(getPRSignatureFrequency(), eventFrequency, eventDuration, eventType);
    }

    function playSoundForPRStatusChange(statusElement) {
        let eventFrequency, eventDuration, eventType;

        const statusText = statusElement.textContent.trim().toLowerCase();
        console.log({ statusText });
        if (statusText.includes('open')) {
            eventFrequency = 659.25; // E5 note
            eventDuration = 0.6;
            eventType = 'sine';
        } else if (statusText.includes('closed')) {
            eventFrequency = 587.33; // D5 note
            eventDuration = 0.6;
            eventType = 'square';
        } else if (statusText.includes('merged')) {
            eventFrequency = 698.46; // F5 note
            eventDuration = 0.6;
            eventType = 'triangle';
        } else {
            eventFrequency = 622.25; // D#5/Eb5 note
            eventDuration = 0.4;
            eventType = 'sawtooth';
        }

        playSequentialTones(getPRSignatureFrequency(), eventFrequency, eventDuration, eventType);
    }


    function playSoundForCommentEdit(commentElement) {
        const eventFrequency = 440; // A4 note
        const eventDuration = 0.3;
        playSequentialTones(getPRSignatureFrequency(), eventFrequency, eventDuration, 'triangle');
    }

    function playSoundForCommentDelete() {
        const eventFrequency = 329.63; // E4 note
        const eventDuration = 0.4;
        playSequentialTones(getPRSignatureFrequency(), eventFrequency, eventDuration, 'sawtooth');
    }

    const commentObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('.js-timeline-item')) {
                        playSoundForNewComment(node);
                    }
                }
                for (const node of mutation.removedNodes) {

                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('.js-comment-container')) {
                        playSoundForCommentDelete();
                    }
                }
            } else if (mutation.type === 'characterData' || (mutation.type === 'attributes' && mutation.attributeName === 'data-body-version')) {
                // Check if the mutation is within a comment
                let commentElement = mutation.target.closest('.js-timeline-item');
                if (commentElement) {
                    playSoundForCommentEdit(commentElement);
                }
            }
        }
    });

    const mergeStatusObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('.merge-status-item')) {
                        playSoundForMergeStatusChange(node, true);
                    }
                }
            } else if (mutation.type === 'attributes' && mutation.target.matches('.merge-status-item')) {
                playSoundForMergeStatusChange(mutation.target, false);
            }
        }
    });

    const prStatusObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                playSoundForPRStatusChange(mutation.target);
            }
        }
    });

    if (isPullRequestPage()) {
        const timelineContainer = document.querySelector('.js-discussion');
        if (timelineContainer) {
            commentObserver.observe(timelineContainer, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['data-body-version']
            });
            console.log('GitHub PR Comment Alert: Monitoring for new comments, edits, and deletions...');
        }

        const mergeStatusList = document.querySelector('.merge-status-list');
        if (mergeStatusList) {
            mergeStatusObserver.observe(mergeStatusList, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
            console.log('GitHub PR Merge Status Alert: Monitoring for merge status changes...');
        }

        const prStatusElement = document.querySelector('span.State');
        if (prStatusElement) {
            prStatusObserver.observe(prStatusElement, { attributes: true, attributeFilter: ['class'] });
            console.log('GitHub PR Status Alert: Monitoring for PR status changes...');
        }
    }



    // Test functions
    window.testPRAlert = {
        newComment: function (text) {
            const dummyComment = document.createElement('div');
            dummyComment.innerHTML = text ?? 'This is a test comment';
            playSoundForNewComment(dummyComment);
        },
        editComment: function () {
            const dummyComment = document.createElement('div');
            playSoundForCommentEdit(dummyComment);
        },
        deleteComment: function () {
            playSoundForCommentDelete();
        },
        mergeStatusChange: function (status) {
            const dummyStatus = document.createElement('div');
            dummyStatus.textContent = status || 'success';
            playSoundForMergeStatusChange(dummyStatus, false);
        },
        prStatusChange: function (status) {
            const dummyStatus = document.createElement('span');
            dummyStatus.textContent = status || 'open';
            playSoundForPRStatusChange(dummyStatus);
        },
        buildDeployed: function () {
            const dummyComment = document.createElement('div');
            dummyComment.textContent = 'PR is build and deployed: Success!';
            playSoundForNewComment(dummyComment);
        }
    };


})();