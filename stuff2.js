// TODO: rename all the 'verb' stuff here to something other.
// Initially it was just a copy-paste from the verb conjugation trainer page.

function shuffle(array) {
  let i = array.length, j, temp;
  while (--i > 0) {
    j = Math.floor(Math.random () * (i+1));
    temp = array[j];
    array[j] = array[i];
    array[i] = temp;
  }
}

const hideVerbProbability = 1.00; // always hide the verb.

// NOTE: possible values: 'full_sentence_match', 'only_verb_match'
let matchMode = "only_verb_match";

const sentenceIndexes = [];

const sentenceObjVerbID = 0;
const sentenceObjGreek = 1;
const sentenceObjEng = 2;
const sentenceObjMetadata = 3;

function setupSentenceIndexes(sentences) {
  sentenceIndexes.length = 0;
  for (let i = 0; i < sentences.length; i++) {
    sentenceIndexes.push(i);
  }

  shuffle(sentenceIndexes);
};

function hideVerb() {
  val = Math.random();
  return (val <= hideVerbProbability)
}

// ensures consistent sorting, ignoring accents and case.
function normalizeGreek(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// this didn't work on sentence "δεν έκανα τίποτα όλη μέρα" for some reason
function hideVerbInSentence(sentence, verb, replacement) {
  // TODO: HACK: better not to lowercase the whole string. Now the process of hiding the verb-
  // also might affect other words in the sentence, which is stupid, but it's quicker for now.
  const x = replacement.repeat(verb.length);
  return sentence.toLowerCase().split(verb).join(x);
}

function runApplication(externalData) {
  // TODO: check externalData validity first ( that all expected fields are present )

  const allSentences = [];
  const sentences = [];

  // TODO: probably better to rename these variables to something more descriptive
  const inputField = document.getElementById('main-text-input');
  const textOneDiv = document.getElementById('verb-show');
  const textTwoDiv = document.getElementById('greek-sentence-show');
  const textThreeDiv = document.getElementById('eng-sentence-show');

  const verbRealDiv = document.getElementById('verb-real');
  const greekSentenceRealDiv = document.getElementById('greek-sentence-real');
  const sentenceMetadataDiv = document.getElementById('sentence-metadata');

  externalData.sentences.forEach((val) => {
    allSentences.push(val);
  });

  let currentSentencesIndex = 0;

  function fillSentences() {
    sentences.length = 0;

    allSentences.forEach(sntc => {
      // const verbID = sntc[sentenceObjVerbID];
      sentences.push(sntc);
    });

    setupSentenceIndexes(sentences);

    currentSentencesIndex = -1;
    nextWord("sentences_updated");
  };

  fillSentences();

  function showWord() {
    updateTextFieldValue(currentSentencesIndex, true);
  };

  function nextWord(statusCode) {
    currentSentencesIndex += 1;

    if (currentSentencesIndex >= sentences.length) {
      setupSentenceIndexes(sentences);
      currentSentencesIndex = 0;
    };

    console.log("All sentences size:" + sentences.length + ". Current index: " + currentSentencesIndex);

    updateTextFieldValue(currentSentencesIndex, false);
  }

  function updateTextFieldValue(idx, forceNoHidingVerb) {
    inputField.value = "";

    if (sentences.length === 0) {
      return;
    };

    const val = sentences[sentenceIndexes[idx]]
    if (!val) {
      console.error("No sentence found at index " + idx);
      console.error("sentences length is: " + sentences.length);
      return;
    }

    const realVerb = val[sentenceObjVerbID].toLowerCase();
    let showVerb = realVerb;
    const realGreekSentence = val[sentenceObjGreek];
    let showGreekSentence = realGreekSentence;

    let hideVerbVar
    if (forceNoHidingVerb) {
      hideVerbVar = false;
    } else {
      hideVerbVar = hideVerb();
    }

    if (hideVerbVar) {
      showVerb = '___';
      showGreekSentence = hideVerbInSentence(realGreekSentence, realVerb, '_');
    }

    const metadata = val[sentenceObjMetadata];
    const metadataFormatted = metadata.gender + " | " + metadata.count + " | " + metadata.case + " | " + metadata.ind;

    textOneDiv.innerHTML = showVerb;
    textTwoDiv.innerHTML = showGreekSentence;

    textThreeDiv.innerHTML = val[sentenceObjEng];

    verbRealDiv.innerHTML = realVerb;
    greekSentenceRealDiv.innerHTML = realGreekSentence;

    sentenceMetadataDiv.innerHTML = metadataFormatted;

    currentVerbID = val[sentenceObjVerbID];
  }

  setupSentenceIndexes(sentences);

  updateTextFieldValue(currentSentencesIndex, false);

  const removeQuestionMark = function(str) {
    // Need to remove the greek question mark, because it's not that easy to type it on
    // an android phone ( there seems to be no dedicated key for it )
    return str.replace(";", "");
  }

  inputField.addEventListener('keyup', (event) => {
    const el = event.target;
    const inputValue = removeQuestionMark(
      el.value.trim().toLowerCase()
    );

    let valueToMatch;

    if (matchMode == "only_verb_match") {
      valueToMatch = verbRealDiv.textContent.trim().toLowerCase();
    } else if (matchMode == "full_sentence_match") {
      valueToMatch = removeQuestionMark(
        greekSentenceRealDiv.textContent.trim().toLowerCase()
      );
    } else {
      throw new Error("matchMode " + matchMode + " is not supported");
    }

    if (inputValue === valueToMatch) {
      console.log("Match on " + valueToMatch);

      nextWord("word_matched");
    } else if (inputValue === "11") {
      showWord();
    // } else if (inputValue === "22") {
    //   swithcHideConjugationMode();
    //   inputField.value = "";
    } else if (inputValue === "33") {
      nextWord("skip");
    }
  });

  const skipBtn = document.getElementById('skip-example-btn');
  skipBtn.addEventListener('click', () => {
    nextWord("skip");
  });
};

window.onload = (event) => {
  fetch('/stuff2.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json(); // parse JSON
    })
    .then(data => {
      runApplication(data);
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
};
