(function (chrome) {
    var layoutChanger, selection, replacer, htmlUtils;

    function LayotChanger() {
        var _ru = "Ё!\"№;%:?*()_+ЙЦУКЕНГШЩЗХЪ/ФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,ёйцукенгшщзхъ\\фывапролджэячсмитьбю.",
            _en = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?`qwertyuiop[]\\asdfghjkl;'zxcvbnm,./",
            currentLayout,
            translateToLayout;

        function initLayoutFromText(text) {

            var symbol, i, length, isRu, isEn;

            currentLayout = null;
            translateToLayout = null;

            text = text.replace(' ', '');

            for (i = 0, length = text.length; i < length; i++) {
                symbol = text[i];
                isRu = _ru.indexOf(symbol) != -1;
                isEn = _en.indexOf(symbol) != -1;

                if ((isRu && isEn) || (!isRu && !isEn)) {//they all contain this character or they all don;t contain it
                    continue;
                }

                currentLayout = isRu ? _ru : _en;
                translateToLayout = isRu ? _en : _ru;

                return true;
            }
        }

        //TODO for different layouts
        this.initLayout = function (elements, from, to) {

            from = htmlUtils.getHtmlOffset(elements[0].innerHTML, from);
            to = htmlUtils.getHtmlOffset(elements[elements.length - 1].innerHTML, to);

            if (elements.length == 1) {
                if (htmlUtils.isValidElement(elements[0]) && htmlUtils.isSelectedText(elements[0].innerHTML) && initLayoutFromText(elements[0].innerHTML.substr(from, to - from))) {
                    return;
                }
                ;
            } else {
                if (htmlUtils.isValidElement(elements[0]) && htmlUtils.isSelectedText(elements[0].innerHTML) && initLayoutFromText(elements[0].innerHTML.substr(from))) {
                    return;
                }
                ;

                for (var i = 1; i < elements.length - 1; i++) {
                    if (htmlUtils.isValidElement(elements[i]) && htmlUtils.isSelectedText(elements[i].innerHTML) && initLayoutFromText(elements[i].innerHTML)) {
                        return;
                    }
                    ;
                }

                if (htmlUtils.isValidElement(elements[elements.length - 1]) && htmlUtils.isSelectedText(elements[elements.length - 1].innerHTML) && initLayoutFromText(elements[elements.length - 1].innerHTML.substr(0, to))) {
                    return;
                }
                ;
            }

            throw new Error('Not inited layout');
        };

        this.change = function (text) {
            var translated = '', letterIndex;
            for (var i = 0, length = text.length; i < length; i++) {
                letterIndex = currentLayout.indexOf(text[i]);
                translated += letterIndex !== -1 ? translateToLayout[letterIndex] : text[i];
            }

            return translated;
        }
    }

    function Selection() {
        function isFromTopSelection(selection, elements) {
            var anchorEl, focusEl;
            if (elements.length == 1) {
                return selection.anchorOffset < selection.focusOffset;
            }

            anchorEl = selection.anchorNode.nodeType == 1 ? selection.anchorNode : selection.anchorNode.parentNode;
            focusEl = selection.focusNode.nodeType == 1 ? selection.focusNode : selection.focusNode.parentNode;

            return elements.indexOf(anchorEl) < elements.indexOf(focusEl);
        }

        /**
         * @return Object{startOffset,endOffset,elements}
         */
        this.getSelection = function () {
            var selection = window.getSelection(),
                range = selection.getRangeAt(0),
                parent = range.commonAncestorContainer,
                elements = [],
                startOffset,
                endOffset,
                selectedFromTop;

            if (parent.nodeType != 1) {
                parent = parent.parentNode;
            }

            if (selection.anchorNode == selection.focusNode) {//one elements selected
                elements.push(parent);
                console.log(parent);
            } else {
                var allWithinRangeParent = parent.getElementsByTagName("*");
console.log(allWithinRangeParent);
                for (var i = 0, el; el = allWithinRangeParent[i]; i++) {
                    if (selection.containsNode(el, true)) {
                        elements.push(el);
                    }
                }
            }

            selectedFromTop = isFromTopSelection(selection, elements);

            startOffset = htmlUtils.isValidElement(elements[0]) ?
                (selectedFromTop ? selection.anchorOffset : selection.focusOffset) :
                0;
            endOffset = htmlUtils.isValidElement(elements[elements.length - 1]) ?
                (selectedFromTop ? selection.focusOffset : selection.anchorOffset) :
                Number.MAX_SAFE_INTEGER; //TODO use element real length

            return {
                elements: elements,
                startOffset: startOffset,
                endOffset: endOffset
            }
        }
    }

    function HtmlUtils() {
        var emptyTagRegex = /^\s+$/;
        this.tagRegexGlobal = /(<\/?.*?\/?>)/g;
        this.tagRegex = /<\/?.*?\/?>/;

        this.getOnlyText = function (element) {
            var ret, self;
            if (typeof element == 'array' || typeof element == 'object') {
                ret = '';
                self = this;

                element.forEach(
                    function (el) {
                        ret += el.innerHTML.replace(self.tagRegexGlobal, '');
                    });
                return ret;
            }
            return element.innerHTML.replace(this.tagRegexGlobal, '');
        };

        this.getHtmlOffset = function (html, textOffset) {

            var splitedTags = this.splitByTags(html), tagsBefore = 0;
            if (splitedTags.length == 1) {
                return textOffset;
            }

            for (var length = splitedTags.length; tagsBefore < length; tagsBefore++) {
                if (this.isSelectedText(splitedTags[tagsBefore])) {
                    break;
                }
            }
            while (tagsBefore-- > 0) {
                textOffset += splitedTags[tagsBefore].length;
            }

            return textOffset;
        };

        //TODO
        this.isValidElement = function (el) {
            return el.className == 'im_msg_text';
        };

        this.isSelectedText = function (text) {

            return !this.tagRegex.test(text) && !emptyTagRegex.test(text) && text.length > 0;
        };

        this.splitByTags = function (html) {

            return html.split(this.tagRegexGlobal);
        }
    }

    function Replacer() {
        function _replaceText(html) {
            var splited = htmlUtils.splitByTags(html), replacedText = '';

            splited.forEach(
                function (text) {
                    if (htmlUtils.isSelectedText(text)) {
                        replacedText += layoutChanger.change(text);
                    } else {
                        replacedText += text;
                    }
                }
            );

            return replacedText;
        }

        this.replaceTextInElement = function (el, from, to) {
            var text = el.innerHTML;

            if (!htmlUtils.isValidElement(el)) {
                return;
            }

            text = el.innerHTML;

            from = from ? htmlUtils.getHtmlOffset(text, from) : 0;
            to = to ? htmlUtils.getHtmlOffset(text, to) : text.length;

            el.innerHTML = text.substr(0, from) + _replaceText(text.substr(from, to - from)) + text.substr(to, text.length);
        }
    }

    function replaceText() {
        var sel = selection.getSelection();
console.log(sel.elements);
        if (sel.elements.length) {
            layoutChanger.initLayout(sel.elements, sel.startOffset, sel.endOffset);
            if (sel.elements.length == 1) {
                replacer.replaceTextInElement(sel.elements[sel.elements.length - 1], sel.startOffset, sel.endOffset);
            } else {
                replacer.replaceTextInElement(sel.elements[0], sel.startOffset);
                for (var i = 1; i < sel.elements.length - 1; i++) {
                    replacer.replaceTextInElement(sel.elements[i]);
                }
                replacer.replaceTextInElement(sel.elements[sel.elements.length - 1], 0, sel.endOffset);
            }

        }
    }

    (function init() {
        layoutChanger = new LayotChanger();
        selection = new Selection();
        replacer = new Replacer();
        htmlUtils = new HtmlUtils();

        chrome.runtime.onMessage.addListener(
            function (request) {
                if (request.message === "change_layout") {
                    replaceText();
                }
            }
        );
    })();

})(chrome);
