function shuffle(array) {
  let i = array.length, j, temp;
  while (--i > 0) {
    j = Math.floor(Math.random () * (i+1));
    temp = array[j];
    array[j] = array[i];
    array[i] = temp;
  }
}

// const hideVerbProbability = 0.50;
const hideVerbProbability = 1.00; // always hide the verb.

// NOTE: possible values: 'full_sentence_match', 'only_verb_match'
const matchMode = "full_sentence_match";
const skipWord = "σκιπ";

const sentenceIndexes = [];

const sentenceObjVerbID = 0;
const sentenceObjVerb = 1;
const sentenceObjGreek = 2;
const sentenceObjEng = 3;
const sentenceObjPluralIndicator = 4;
const sentenceObjTenseIndicator = 5;

const enabledTenses = ["present", "past", "future"];

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

// this didn't work on sentence "δεν έκανα τίποτα όλη μέρα" for some reason
function hideVerbInSentence(sentence, verb, replacement) {
  // TODO: HACK: better not to lowercase the whole string. Now the process of hiding the verb-
  // also might affect other words in the sentence, which is stupid, but it's quicker for now.
  const x = replacement.repeat(verb.length);
  return sentence.toLowerCase().split(verb).join(x);
}

function runApplication(externalData) {
  const allSentences = [];
  const sentences = [];

  // TODO: probably better to rename these variables to something more descriptive
  const inputField = document.getElementById('main-text-input');
  const textOneDiv = document.getElementById('verb-show');
  const textTwoDiv = document.getElementById('greek-sentence-show');
  const textThreeDiv = document.getElementById('eng-sentence-show');

  const verbRealDiv = document.getElementById('verb-real');
  const greekSentenceRealDiv = document.getElementById('greek-sentence-real');

  const divConjugationPresent = document.getElementById('conjugation-present');
  const divConjugationPast = document.getElementById('conjugation-past');
  const divConjugationFuture = document.getElementById('conjugation-future');
  const divVerbType = document.getElementById('verb-type');

  for (let key in externalData.verbs) {
    externalData.verbs[key].sentences.forEach(sntc => {
      let arr = [key, ...sntc];
      allSentences.push(arr);
    });
  }

  let currentSentencesIndex = 0;

  // TODO: check externalData validity first ( that all expected fields are present )
  function fillSentences() {
    sentences.length = 0;

    allSentences.forEach(sntc => {
      const tense = sntc[sentenceObjTenseIndicator];
      if (enabledTenses.includes(tense)) {
        sentences.push(sntc);
      };
    });

    setupSentenceIndexes(sentences);
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

    updateTextFieldValue(currentSentencesIndex, false);
  }

  function updateTextFieldValue(idx, forceNoHidingVerb) {
    inputField.value = "";

    const val = sentences[sentenceIndexes[idx]]

    const realVerb = val[sentenceObjVerb].toLowerCase();
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

    textOneDiv.innerHTML = showVerb;
    textTwoDiv.innerHTML = showGreekSentence;

    var pluralStr = "";

    if (val[sentenceObjPluralIndicator] === "p") {
      pluralStr = "(plural)";
    };
    textThreeDiv.innerHTML = val[sentenceObjEng] + pluralStr;

    verbRealDiv.innerHTML = realVerb;
    greekSentenceRealDiv.innerHTML = realGreekSentence;

    const verbID = val[sentenceObjVerbID];

    let conjugation

    // NOTE: can also hide the verb in the conjugation section too, but for now I chose not to do it :
    // if (hideVerbVar) {
    if (false) {
      conjugation = {
        "present": ["_"],
        "past": ["_"],
        "future": ["_"]
      }
    } else {
      conjugation = externalData.verbs[verbID].conjugation
    }
    // TODO: can add them as separate divs, not just text joined with br.
    // add class to each div - and then js can update the style of particular words
    // ( to highlight current active verb form , for example )
    divConjugationPresent.innerHTML = conjugation["present"].join("</br>") ;
    divConjugationPast.innerHTML = conjugation["past"].join("</br>") ;
    divConjugationFuture.innerHTML = conjugation["future"].join("</br>") ;
    divVerbType.innerHTML = externalData.verbs[verbID].verbType;
  }

  setupSentenceIndexes(sentences);

  updateTextFieldValue(currentSentencesIndex, false);

  const removeQuestionMark = function(str) {
    // Need to remove the greek question mark, because it's not that easy to type it on
    // an android phone ( there seems to be no dedicated key for it )
    return str.replace(";", "");
  }

  inputField.addEventListener('keyup', () => {
    const inputValue = removeQuestionMark(
      inputField.value.trim().toLowerCase()
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
    } else if (inputValue.length === 3 && inputValue[0] === inputValue[1] && inputValue[1] === inputValue[2]) {
      showWord();
    } else if (inputValue === skipWord) {
      nextWord("skip");
    }
  });

  const presentTenseSwitch = document.getElementById('enable-present-tense');
  const pastTenseSwitch = document.getElementById('enable-past-tense');
  const futureTenseSwitch = document.getElementById('enable-future-tense');

  function addTense(tenseName) {
    let index = enabledTenses.indexOf(tenseName);

    if (index !== -1) {
      return;
    }

    enabledTenses.push(tenseName);

    fillSentences();
  };

  function removeTense(tenseName) {
    let index = enabledTenses.indexOf(tenseName);

    if (index !== -1) {
      enabledTenses.splice(index, 1);
    }

    console.log("removed " + tenseName);
    console.log("xxx: " + JSON.stringify(enabledTenses));

    fillSentences();
  };

  presentTenseSwitch.addEventListener("change", function() {
    if (presentTenseSwitch.checked) {
      addTense("present");
    } else {
      removeTense("present");
    }
  });

  pastTenseSwitch.addEventListener("change", function() {
    pastTenseSwitch.checked ? addTense("past") : removeTense("past");
  });

  futureTenseSwitch.addEventListener("change", function() {
    if (futureTenseSwitch.checked) {
      addTense("future");
    } else {
      removeTense("future");
    }
  });
};

window.onload = (event) => {
  fetch('/foo.json')
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


