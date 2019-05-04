const handleChange = ({ target: { value } }) => {
  chrome.storage.sync.set({
    pattern: value
  });
};

const patternInput = document.getElementById('pattern_input');

patternInput.onkeyup = handleChange;

chrome.storage.sync.get(['pattern'], ({ pattern }) => {
  patternInput.value = pattern;
});
