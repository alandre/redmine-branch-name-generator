const _letterAssociations = {
  'а': 'a',
  'б': 'b',
  'в': 'v',
  'г': 'g',
  'д': 'd',
  'е': 'e',
  'ё': 'e',
  'ж': 'zh',
  'з': 'z',
  'и': 'i',
  'й': 'i',
  'к': 'k',
  'л': 'l',
  'м': 'm',
  'н': 'n',
  'о': 'o',
  'п': 'p',
  'р': 'r',
  'с': 's',
  'т': 't',
  'у': 'u',
  'ф': 'f',
  'х': 'h',
  'ц': 'c',
  'ч': 'ch',
  'ш': 'sh',
  'щ': 'sh',
  'ъ': '',
  'ы': 'i',
  'ь': '',
  'э': 'e',
  'ю': 'yu',
  'я': 'ya',
};

function fromUTF8Array(data = []) {
  let str = '';

  for (let i = 0; i < data.length; i++) {
    const value = data[i];

    if (value < 0x80) {
      str += String.fromCharCode(value);
    } else if (value > 0xBF && value < 0xE0) {
      str += String.fromCharCode((value & 0x1F) << 6 | data[i + 1] & 0x3F);
      i += 1;
    } else if (value > 0xDF && value < 0xF0) {
      str += String.fromCharCode((value & 0x0F) << 12 | (data[i + 1] & 0x3F) << 6 | data[i + 2] & 0x3F);
      i += 2;
    } else {
      // surrogate pair
      const charCode = ((value & 0x07) << 18 | (data[i + 1] & 0x3F) << 12 | (data[i + 2] & 0x3F) << 6 | data[i + 3] & 0x3F) - 0x010000;

      str += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00);
      i += 3;
    }
  }

  return str;
}

function translate(text, {
  sourceLang = 'auto',
  targetLang = 'en'
} = {}) {

  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="
    + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(text);

  return fetch(url)
    .then(result => result.body.getReader())
    .then(reader => reader.read())
    .then(({value}) => fromUTF8Array(value))
    .then(JSON.parse)
    .then(result => result[0][0][0]);
}

const transliterate = (src = '', spaceReplacement = ' ') => {
  const normalizedSrc = src.normalize().toLowerCase().replace(/[^0-9a-zа-яё]+/g, ' ').trim();

  let result = '';
  for (let i = 0; i < normalizedSrc.length; i++) {
    if (normalizedSrc[i] === ' ') {
      result += spaceReplacement;
      continue;
    }

    const newLetter = _letterAssociations[normalizedSrc[i]];
    result += typeof newLetter !== 'undefined' ? newLetter : normalizedSrc[i];
  }

  return result;
};

const generateBranchNameNode = (branchName = '') => {
  const node = document.createElement('div');
  node.className = 'branch';
  node.id = 'generatedBranchName';
  node.innerHTML = `Branch name (<a class="branch-copy icon icon-copy" href="#">Copy to clipboard</a>): <input class="branch-name" value="${branchName}" disabled>`;

  const copyLink = node.querySelector('a');
  const input = node.querySelector('input');

  copyLink.addEventListener('click', () => {
    input.disabled = false;
    input.focus();
    input.select();
    document.execCommand('copy');
    input.selectionEnd = 0;
    input.disabled = true;
  });

  return node;
};

const normalize = str => str.replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿА-ЯЁа-яё]+/g, ' ').trim();

const prepareInjectionData = () => {
  const header = document.querySelector('#content > h2');
  const task = document.querySelector('.subject h3');

  const [_, tracker, id] = /^([a-zA-Z]+) #([0-9]+)$/.exec(header.textContent);
  const text = normalize(task.textContent);

  return translate(text)
    .then(taskName => ({
      taskName,
      tracker,
      header,
      id
    }));
};

const injectBranchName = ({
  pattern = '{TYPE}/{ID}-{TASK-NAME}',
  trackersMap = {},
  taskName,
  tracker,
  header,
  id,
}) => {
  if (document.getElementById('generatedBranchName')) {
    document.getElementById('generatedBranchName').remove();
  }

  const branchName = Object.entries({
    '{TYPE}': trackersMap[tracker],
    '{ID}': id,
    '{TASK_NAME}': transliterate(taskName, '_'),
    '{TASK-NAME}': transliterate(taskName, '-'),
  }).reduce(
    (str, [searchValue, replaceValue]) => str.replace(searchValue, replaceValue),
    pattern,
  );

  header.after(generateBranchNameNode(branchName));
};

const _trackersMap = {
  'Bug': 'bugfix',
  'Task': 'feature',
  'Feature': 'feature',
  'Support': 'feature',
};

chrome.extension.sendMessage({}, response => {
  const readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      if (/^\/issues\/[0-9]+/.test(window.location.pathname)) {
        prepareInjectionData().then(({
          id,
          header,
          tracker,
          taskName,
        }) => {
          chrome.storage.sync.get(['pattern'], ({ pattern }) => {
            injectBranchName({
              trackersMap: _trackersMap,
              taskName,
              pattern,
              tracker,
              header,
              id,
            });
          });

          chrome.storage.onChanged.addListener(({ pattern }) => {
            if (pattern) {
              injectBranchName({
                trackersMap: _trackersMap,
                taskName,
                pattern: pattern.newValue,
                tracker,
                header,
                id,
              });
            }
          })
        });
      }
    }
  }, 10);
});
