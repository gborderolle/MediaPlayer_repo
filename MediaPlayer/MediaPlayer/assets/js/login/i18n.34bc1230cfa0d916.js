/* jshint forin:true, noarg:true, jquery:true, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:false, unused:vars, curly:true, browser:true, indent:false, maxerr:50, quotmark:false */

/* global inConcert*/

/*
Module for handling translation and i18n related stuff
*/

// Create an inConcert object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.inConcert) {
    this.inConcert = {};
}


(function () {
	//'use strict';

	//it sits here for performance, matchs strings  $("texto")
	var m_translationRegexp = new RegExp('\\$\\("([^"]+)"\\)');

	//process the current DOM node in order to translate its contents if needed
	function walkNode(node){
		var match;
		//are there any attributes needing translation?
		for(var i = node.attributes.length - 1; i >= 0; i--){
			var attr = node.attributes[i];
			match = attr.value.match(m_translationRegexp);
			if (match) {
				var translatedString = inConcert.i18n.getString(match[1]);
				attr.value = translatedString;
			}
		}
		//node content needs translation?
		$(node).contents().each(function() {
			//only touch the inmediate text of the node, not the descendants
			if (this.nodeType === 3) {
				$(this).replaceWith(this.wholeText.replace(m_translationRegexp, function(_, capture) {
					return inConcert.i18n.getString(capture);
				}));
			}
		});
		//node value?
		match = $(node).val() ? $(node).val().match(m_translationRegexp) : null;
		if (match) {
			$(node).val(inConcert.i18n.getString(match[1]));
		}
	}

	//iterates over the childs of root in a custom way, handy when createTreeWalker is not available
	function customIterativeTreeWalker(root, fnNodeProcessor) {
		var node = root.childNodes[0];
		while(node !== null) {
			if(node.nodeType === 3) {
				fnNodeProcessor(node);
			}
			if(node.hasChildNodes()) {
				node = node.firstChild;
			}
			else {
				while(node.nextSibling === null && node !== root) {
					node = node.parentNode;
				}
				node = node.nextSibling;
			}
		}
	}

	//Application abstract class, every registered application must derive from this class.
	function i18n() {
		this.m_strings = {
			"prpl-yahoo" : "Yahoo",
			"prpl-msn": "MSN",
			"prpl-jabber" : "GTalk",
			"IM" : "Instant Messaging",
			"FACEBOOK" : "Facebook",
			"TWITTER" : "Twitter",
			"CALL" : "Calls",
			"INTERNAL_CHAT" : "Internal Chats",
			"CHAT" : "Web Chats",
			"SMS" : "SMS",
			"MAIL" : "Mail",
			"WEBCONTACT": "Web contact"
		};
		this.m_loaded = true;
	}

	//retrieves a translated string from the cache according to the user selected language
	i18n.prototype.getString = function(key) {
		return this.m_loaded && this.m_strings[key] ? this.m_strings[key] : key;
	};

	/*
		Returns the user language TODO
	 */
	i18n.prototype.getLanguage = function() {
		return "en";
	};

	//sets or changes the user language
	i18n.prototype.setLanguage = function(_) {
		var translator = this;
		inConcert.invoke({
			url: url,
			success: function(response) {
				translator.m_strings = response || {};
				translator.m_loaded = true;
			}
		});
	};

	//updates the DOM with the current language, if no dom element is specified the whole document is updated
	//the traversing is done using createWalkterTree if available(IE not helping the cause)
	//TODO this traversing is missing strings
	i18n.prototype.updateScreen = function(root) {
		var baseNode = root || document.body;
		if (document.createTreeWalker) {
			var treeWalker = document.createTreeWalker(
				baseNode,
				NodeFilter.SHOW_ELEMENT,
				{
					acceptNode: function(_) { return NodeFilter.FILTER_ACCEPT; }
				},
				false
			);
			while(treeWalker.nextNode()) {
				walkNode(treeWalker.currentNode);
			}
		}
		else {
			customIterativeTreeWalker(baseNode, walkNode);
		}
	};

	if (typeof inConcert.i18n !== 'object') {
		//integration manager is a singleton so it's published already initialized
		//(everyone should see the same registered application list)
		inConcert.i18n = new i18n();
	}
}());