// @ts-ignore
import randy from "randy";
import articles from "articles/lib/Articles.js";
import natural from "natural";
import nouns from "../words/nouns/singular.mjs";
import no_plural_nouns from "../words/nouns/no-plural.mjs";
import actor_nouns from "../words/nouns/actors.mjs";
import oragnization_nouns from "../words/nouns/organizations.mjs";
import adjectives from "../words/adjectives/adjectives.mjs";
import latives from "../words/adjectives/latives.mjs"; 
import verbs from "../words/verbs/infinitive.mjs";
import duration from "../words/dates/duration.mjs";
import { phrases } from "../words/phrases.mjs";
import { templates } from "../words/templates.mjs";

const noun_inflector = new natural.NounInflector();
const verb_inflector = new natural.PresentVerbInflector();


/**
 * @template T
 * @type {{ [key: string]: (...args: T[]) => void}}
 */
const actions = {
	noun_organization: function() {
		return randy.choice(oragnization_nouns);
	},
	a_noun_actors: function() {
		return articles.articlize(randy.choice(actor_nouns));
	},
	noun_demonyms: function() {
		return randy.choice(noun_inflector.singularize(randy.choice(actor_nouns)));
	},
	adjective_latives: function() {
		return randy.choice(latives);
	},
	noun_organization: function() {
		return randy.choice(oragnization_nouns);
	},
	noun_nonplural: function() {
		return randy.choice(no_plural_nouns);
	},
	noun_actors: function() {
		return randy.choice(actor_nouns);
	},
	date_duration: function() {
		return randy.choice(duration);
	},
	noun: function () {
		return randy.choice(nouns);
	},
	nouns: function () {
		return noun_inflector.pluralize(randy.choice(nouns));
	},
	verb: function () {
		return randy.choice(verbs);
	},
	verbs: function () {
		return verb_inflector.pluralize(randy.choice(verbs));
	},
	adjective: function () {
		return randy.choice(adjectives);
	},
	a_noun: function () {
		return articles.articlize(randy.choice(nouns));
	},
	an_adjective: function () {
		return articles.articlize(randy.choice(adjectives));
	},
	a_verb: function () {
		return articles.articlize(randy.choice(verbs) + "ing");
	},
	verb_past: function () {
		return randy.choice(verbs) + "ed";
	},
	verb_present_participle: function () {
		return randy.choice(verbs) + "ing";
	}
};

/**
 * @param {string} string String to be parsed. {{ action }} action is the word to be replaced.
 */
export async function random_sentence(string) {
	let sentence = string;
	let result = "";

	// Matches all occurences of {{ ... }} where ... is any character to be replaced. For example {{ noun }} will be replaced with a noun.
	const occurences = sentence.match(/{{(.+?)}}/g);

	if (!occurences && occurences?.length === 0) {
		return sentence;
	}

	for (let idx = 0; idx < occurences.length; ++idx) {
		const to_be_replaced = occurences[idx].replace(/{{|}}/g, "").trim();
		const is_function = to_be_replaced.match(/^\w+\((.+?)\)$/);

		if (is_function) {
			const function_name = to_be_replaced.match(/^(\w+)/)[1];
			const function_args = is_function[1]
				.split(",")
				.map((arg) => turn_num_string_into_number(arg.trim()));

			if (function_args) {
				try {
					result = actions[function_name].apply(null, function_args);
				} catch (err) {}
			} else {
				if (actions[function_name]) {
					result = actions[function_name]();
				} else {
					result = "{{ " + function_name + " }}";
				}
			}
		} else {
			if (actions[to_be_replaced]) {
				result = actions[to_be_replaced]();
			} else {
				result = "{{ " + to_be_replaced + " }}";
			}
		}

		sentence = sentence.replace(occurences[idx], result);
	}

	return sentence;
}

function turn_num_string_into_number(string) {
	if (string.match(/^\d+$/) != null) {
		return +string;
	}

	return string;
}

/**
 * @param {size} [size] Size of the paragraph to be generated.
 */
export async function generate_sentence(size) {
	const sentence_length = size || randy.randInt(1, 4);
	let paragraph = "";

	for (let idx = 0; idx < sentence_length; ++idx) {
		const phrase = Math.random() < 0.25 ? `${randy.choice(phrases)} ` : "";
		const template = await random_sentence(randy.choice(templates));
		const sentence =
			capitalize(phrase + template) +
			"." +
			(idx === sentence_length - 1 ? "" : " ");
		paragraph += sentence;
	}

	return paragraph;
}

function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
