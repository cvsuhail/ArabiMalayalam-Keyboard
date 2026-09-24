const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless',
      '--disable-gpu',
      '--remote-debugging-port=9225',
      '--window-size=1440,900',
      'http://localhost:8080/',
    ],
    { stdio: 'ignore' }
  );

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9225/json/list');
    const targets = await listRes.json();
    const page = targets.find((t) => t.type === 'page') || targets[0];
    if (!page || !page.webSocketDebuggerUrl) {
      throw new Error('No page target found');
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data);
        callbacks.delete(data.id);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        callbacks.set(curId, resolve);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await new Promise((r) => {
      ws.onopen = r;
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    await sleep(1200);

    // 1. English to Arabi-Malayalam with 'o': Type "onnu"
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const ta = document.querySelector('textarea');
          if (ta) {
            ta.focus();
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            setter.call(ta, 'onnu');
            ta.setSelectionRange(4, 4);
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `,
    });

    await sleep(700);

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot1.result && shot1.result.data) {
      fs.writeFileSync(
        '/Users/random/.gemini/antigravity-ide/brain/691d6d4c-03ac-4cb6-9525-31ac0ac34097/verify_onnu_auto.png',
        Buffer.from(shot1.result.data, 'base64')
      );
      console.log('Saved verify_onnu_auto.png');
    }

    // 2. Malayalam to Arabi-Malayalam with 'o': Type "പോയി"
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const ta = document.querySelector('textarea');
          if (ta) {
            ta.focus();
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            setter.call(ta, 'പോയി');
            ta.setSelectionRange(4, 4);
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `,
    });

    await sleep(700);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot2.result && shot2.result.data) {
      fs.writeFileSync(
        '/Users/random/.gemini/antigravity-ide/brain/691d6d4c-03ac-4cb6-9525-31ac0ac34097/verify_poyi_auto.png',
        Buffer.from(shot2.result.data, 'base64')
      );
      console.log('Saved verify_poyi_auto.png');
    }

    // 3. Arabic to Arabi-Malayalam: Type "سلام"
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          const ta = document.querySelector('textarea');
          if (ta) {
            ta.focus();
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            setter.call(ta, 'سلام');
            ta.setSelectionRange(4, 4);
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `,
    });

    await sleep(700);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot3.result && shot3.result.data) {
      fs.writeFileSync(
        '/Users/random/.gemini/antigravity-ide/brain/691d6d4c-03ac-4cb6-9525-31ac0ac34097/verify_salam_auto.png',
        Buffer.from(shot3.result.data, 'base64')
      );
      console.log('Saved verify_salam_auto.png');
    }

    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    chrome.kill();
  }
}

run();
