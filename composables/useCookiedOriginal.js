import { getCurrentInstance, nextTick, onUnmounted, ref, watch } from 'vue';
import { parse, serialize } from 'cookie-es';
import { deleteCookie, getCookie, setCookie } from 'h3';
import destr from 'destr';
import { isEqual } from 'ohash';

const CookieDefaults = {
  path: '/',
  watch: true,
  decode: (val) => destr(decodeURIComponent(val)),
  encode: (val) =>
    encodeURIComponent(typeof val === 'string' ? val : JSON.stringify(val)),
};

export function useCookiedOriginal(name, _opts) {
  const opts = { ...CookieDefaults, ..._opts };

  console.log('before read raw cookies call');
  const cookies = readRawCookies(opts) || {};
  console.log('after read raw cookies call');

  const cookie = ref(cookies[name] ?? opts.default?.());

  if (process.client) {
    const channel =
      typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel(`nuxt:cookies:${name}`);
    if (getCurrentInstance()) {
      onUnmounted(() => {
        channel?.close();
      });
    }

    const callback = () => {
      console.log('callback triggered');
      writeClientCookie(name, cookie.value, opts);
      console.log('after write client cookie');
      channel?.postMessage(cookie.value);
      console.log('after post message');
    };

    let watchPaused = false;

    if (channel) {
      channel.onmessage = (event) => {
        watchPaused = true;
        cookie.value = event.data;
        nextTick(() => {
          watchPaused = false;
        });
      };
    }

    if (opts.watch) {
      watch(
        cookie,
        (newVal, oldVal) => {
          if (watchPaused || isEqual(newVal, oldVal)) {
            return;
          }
          callback();
        },
        { deep: opts.watch !== 'shallow' }
      );
    } else {
      callback();
    }
  } else if (process.server) {
    const nuxtApp = useNuxtApp();
    const writeFinalCookieValue = () => {
      if (!isEqual(cookie.value, cookies[name])) {
        writeServerCookie(useRequestEvent(nuxtApp), name, cookie.value, opts);
      }
    };
    const unhook = nuxtApp.hooks.hookOnce(
      'app:rendered',
      writeFinalCookieValue
    );
    nuxtApp.hooks.hookOnce('app:error', () => {
      unhook(); // don't write cookie subsequently when app:rendered is called
      return writeFinalCookieValue();
    });
  }

  console.log('at end of useCookied def ');

  return cookie;
}

function readRawCookies(opts = {}) {
  if (process.server) {
    return parse(useRequestEvent()?.node.req.headers.cookie || '', opts);
  } else if (process.client) {
    console.log('reading raw cookies, before parse: ', document.cookie);
    const parsed = parse(document.cookie, opts);
    console.log('reading raw cookies, after parse: ', document.cookie);
    return parsed;
  }
}

function serializeCookie(name, value, opts = {}) {
  if (value === null || value === undefined) {
    return serialize(name, value, { ...opts, maxAge: -1 });
  }
  return serialize(name, value, opts);
}

function writeClientCookie(name, value, opts = {}) {
  if (process.client) {
    console.log('writing cookie on client');
    console.log('name: ', name);
    console.log('value: ', value);
    document.cookie = serializeCookie(name, value, opts);
    console.log('document.cookie is now: ', document.cookie);
  }
}

function writeServerCookie(event, name, value, opts = {}) {
  if (event) {
    // update if value is set
    if (value !== null && value !== undefined) {
      console.log('writing cookie on server');
      console.log('name: ', name);
      console.log('value: ', value);
      return setCookie(event, name, value, opts);
    }

    // delete if cookie exists in browser and value is null/undefined
    if (getCookie(event, name) !== undefined) {
      return deleteCookie(event, name, opts);
    }

    // else ignore if cookie doesn't exist in browser and value is null/undefined
  }
}
