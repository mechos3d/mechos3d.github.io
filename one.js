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
let matchMode = "full_sentence_match";
let hideConjugations = false;
let onlyRegularVerbsMode = false;

const sentenceIndexes = [];

const sentenceObjVerbID = 0;
const sentenceObjVerb = 1;
const sentenceObjGreek = 2;
const sentenceObjEng = 3;
const sentenceObjPluralIndicator = 4;
const sentenceObjTenseIndicator = 5;

// TODO: change this to Set instead of an array :
const enabledTenses = ["present", "past", "future"];
const disabledVerbs = new Set([]);
// focusedVerb higher priority than 'disabledVerbs'. If it's not empty - then only examples with this verb will be shown.
// ( was done mostly to QUICKLY show conjugation for a specific verb )
let focusedVerb = null;

let currentVerbID;

let wordMatched = false;

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
  const allVerbs = [];
  const engToGreekTranslations = {};

  // TODO: probably better to rename these variables to something more descriptive
  const inputField = document.getElementById('main-text-input');
  // const textOneDiv = document.getElementById('verb-show');
  const textTwoDiv = document.getElementById('greek-sentence-show');
  const textThreeDiv = document.getElementById('eng-sentence-show');

  const verbRealDiv = document.getElementById('verb-real');
  const greekSentenceRealDiv = document.getElementById('greek-sentence-real');

  const divConjugationPresent = document.getElementById('conjugation-present');
  const divConjugationPast = document.getElementById('conjugation-past');
  const divConjugationFuture = document.getElementById('conjugation-future');
  const divVerbType = document.getElementById('verb-type');

  const divAllVerbsListContainer = document.getElementById('verbs-list-container');

  const buttonDisableAllVerbs = document.getElementById('disabled-verbs-disable-all');
  const buttonEnableAllVerbs = document.getElementById('disabled-verbs-enable-all');
  const buttonEnableOnlyRegulars = document.getElementById('disabled-verbs-enable-regulars');
  const buttonEnableOnlyIrregulars = document.getElementById('disabled-verbs-enable-irregulars');

  const focusedVerbInput = document.getElementById('focused-verb-input');

  const tempAllVerbsSet = new Set([]);

  for (let key in externalData.verbs) {
    externalData.verbs[key].sentences.forEach(sntc => {
      let arr = [key, ...sntc];
      allSentences.push(arr);

      tempAllVerbsSet.add(key);
    });

    externalData.verbs[key].engTranslations.forEach(engTrans => {
      engToGreekTranslations[engTrans.toLowerCase()] = key
    });
  }

  const tempArr = [...tempAllVerbsSet];

  tempArr.sort((a, b) =>
    normalizeGreek(a).localeCompare(normalizeGreek(b), 'el')
  );

  tempArr.forEach(verbID => { allVerbs.push(verbID) })

  // Draw checkboxes to allow enable/disable verbs :
  allVerbs.forEach(verbID => {
    const el = 'foo-bar: ' + verbID;

    const spType = externalData.verbs[verbID].specialType;
    let spTypeClass;

    if (spType === "regular") {
      spTypeClass = "all-verbs-list-regular";
    } else if (spType === "special") {
      spTypeClass = "all-verbs-list-special";
    } else {
      throw new Error("Unknown specialType: " + spType);
    }

    // 1. Create the checkbox for including/excluding the verb
    const newCheckbox = document.createElement('input');
    newCheckbox.type = 'checkbox';
    newCheckbox.id = `disable-verb-checkbox-${verbID}`;
    newCheckbox.checked = true;
    newCheckbox.setAttribute('data-verb-id', verbID);
    newCheckbox.setAttribute('data-verb-regularity', spType);

    newCheckbox.addEventListener('change', function (event) {
      const el = event.target;
      const verbID = el.getAttribute('data-verb-id');
      if (el.checked) {
        disabledVerbs.delete(verbID);
        fillSentences();
      } else {
        disabledVerbs.add(verbID);
        fillSentences();
      };
    });
    // 1-end

    // 2. Create the label
    const label = document.createElement('label');
    label.setAttribute('class', ('disable-verb-label tooltip ' + spTypeClass));
    label.appendChild(newCheckbox);

    const tooltipSpan = document.createElement('span');
    tooltipSpan.setAttribute('class', 'tooltiptext');
    const tooltipText = externalData.verbs[verbID].engTranslations.join(", ");
    tooltipSpan.append(tooltipText);

    const labelText = verbID;
    label.append(tooltipSpan);
    label.append(labelText);
    // 2-end

    divAllVerbsListContainer.appendChild(label);
    divAllVerbsListContainer.insertAdjacentHTML('beforeend', '</br>');
  });

  buttonDisableAllVerbs.addEventListener('click', function (event) {
    divAllVerbsListContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false; // disable all verbs
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  buttonEnableAllVerbs.addEventListener('click', function (event) {
    divAllVerbsListContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = true; // enable all verbs
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  buttonEnableOnlyRegulars.addEventListener('click', function (event) {
    divAllVerbsListContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      if (checkbox.dataset.verbRegularity === "regular") {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  buttonEnableOnlyIrregulars.addEventListener('click', function (event) {
    divAllVerbsListContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      if (checkbox.dataset.verbRegularity === "regular") {
        checkbox.checked = false;
      } else {
        checkbox.checked = true;
      }
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  let currentSentencesIndex = 0;

  function fillSentences() {
    sentences.length = 0;

    allSentences.forEach(sntc => {
      const tense = sntc[sentenceObjTenseIndicator];

      const verbID = sntc[sentenceObjVerbID];
      const specialType = externalData.verbs[verbID].specialType;

      if (onlyRegularVerbsMode && specialType !== "regular") {
        return; // skip this sentence
      };

      if (enabledTenses.includes(tense)) {
        if (focusedVerb != null) {

          if (normalizeGreek(focusedVerb) !== normalizeGreek(verbID)) {
            return; // skip this sentence
          }
        };

        if (disabledVerbs.size > 0 && disabledVerbs.has(verbID)) {
          return; // skip this sentence
        }
        sentences.push(sntc);
      };
    });

    setupSentenceIndexes(sentences);

    currentSentencesIndex = -1;
    nextWord("sentences_updated");
  };

  fillSentences();

  function showWord() {
    updateTextFieldValue(currentSentencesIndex, true, false);
  };

  function nextWord(statusCode) {
    currentSentencesIndex += 1;

    if (currentSentencesIndex >= sentences.length) {
      setupSentenceIndexes(sentences);
      currentSentencesIndex = 0;
    };

    console.log("All sentences size:" + sentences.length + ". Current index: " + currentSentencesIndex);

    inputField.classList.remove('main-text-input-border-success');
    wordMatched = false;
    updateTextFieldValue(currentSentencesIndex, false, false);
  }

  function updateTextFieldValue(idx, forceNoHidingVerb, noInputFieldUpdate) {
    if (!noInputFieldUpdate) {
      inputField.value = "";
    }

    if (sentences.length === 0) {
      return;
    };

    const val = sentences[sentenceIndexes[idx]]
    if (!val) {
      console.error("No sentence found at index " + idx);
      console.error("sentences length is: " + sentences.length);
      return;
    }

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

    // textOneDiv.innerHTML = showVerb;
    textTwoDiv.innerHTML = showGreekSentence;

    var pluralStr = "";

    if (val[sentenceObjPluralIndicator] === "p") {
      pluralStr = "(plural)";
    };
    textThreeDiv.innerHTML = val[sentenceObjEng] + pluralStr;

    verbRealDiv.innerHTML = realVerb;
    greekSentenceRealDiv.innerHTML = realGreekSentence;

    // const verbID = val[sentenceObjVerbID];
    currentVerbID = val[sentenceObjVerbID];

    showConjugations();

    divVerbType.innerHTML = externalData.verbs[currentVerbID].verbType;
  }

  function showConjugations() {
    const conjugation = externalData.verbs[currentVerbID].conjugation

    // TODO: can add them as separate divs, not just text joined with br.
    // add class to each div - and then js can update the style of particular words
    // ( to highlight current active verb form , for example )
    if (hideConjugations) {
      divConjugationPresent.innerHTML = conjugation["present"][0];
      divConjugationPast.innerHTML = "";
      divConjugationFuture.innerHTML = "";
    } else {
      divConjugationPresent.innerHTML = conjugation["present"].join("</br>") ;
      divConjugationPast.innerHTML = conjugation["past"].join("</br>") ;
      divConjugationFuture.innerHTML = conjugation["future"].join("</br>") ;
    };
  };

  setupSentenceIndexes(sentences);

  updateTextFieldValue(currentSentencesIndex, false, false);

  const removeQuestionMark = function(str) {
    // Need to remove the greek question mark, because it's not that easy to type it on
    // an android phone ( there seems to be no dedicated key for it )
    return str.replace(";", "");
  }

  inputField.addEventListener('beforeinput', function(event) {
    if (wordMatched && event.key !== 'Enter') {
      event.preventDefault(); // cancel the input
    }
  });

  inputField.addEventListener('keyup', (event) => {
    if (wordMatched) {
      if (event.key === 'Enter') {
        nextWord("word_matched");
      } else {
        // this should be impossible case..
        return;
      }
    }

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
      // only paint the input green and then wait for 'Enter' key to be pressed.
      inputField.classList.add('main-text-input-border-success');
      updateTextFieldValue(currentSentencesIndex, true, true);
      wordMatched = true;
    } else if (inputValue === "11") {
      showWord();
    } else if (inputValue === "22") {
      swithcHideConjugationMode();
      inputField.value = "";
    } else if (inputValue === "33") {
      nextWord("skip");
    }
  });

  focusedVerbInput.addEventListener('keyup', (event) => {
    const el = event.target;
    const inputValue = el.value.trim().toLowerCase()
    if (inputValue.length === 0) {
      focusedVerb = null;
      fillSentences();
      return;
    } else {
      const fromEngTranslation = engToGreekTranslations[inputValue]
      if (fromEngTranslation !== undefined) {
        focusedVerb = fromEngTranslation;
      } else {
        focusedVerb = inputValue;
      };
      fillSentences();
    }
  });

  function swithcHideConjugationMode() {
    hideConjugations = !hideConjugations;
    showConjugations();
  };

  const presentTenseSwitch = document.getElementById('enable-present-tense');
  const pastTenseSwitch = document.getElementById('enable-past-tense');
  const futureTenseSwitch = document.getElementById('enable-future-tense');

  const matchModeSwitch = document.getElementById('only-verb-match-mode');
  const hideConjugationModeSwitch = document.getElementById('hide-conjugations');

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
    fillSentences();
  };

  // gTODO: change event-listeners to function(event) --> event.target.checked
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

  matchModeSwitch.addEventListener("change", function(event) {
    const el = event.target;
    if (el.checked) {
      matchMode = "only_verb_match";
    } else {
      matchMode = "full_sentence_match";
    }
  });

  hideConjugationModeSwitch.addEventListener("change", function(event) {
    const el = event.target;
    if (el.checked) {
      hideConjugations = true;
    } else {
      hideConjugations = false;
    }

    showConjugations();
  });

  const skipBtn = document.getElementById('skip-example-btn');
  skipBtn.addEventListener('click', () => {
    nextWord("skip");
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
