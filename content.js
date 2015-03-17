(function(chrome) {
    var layoutChanger, selection, replacer, htmlUtils;

    function LayotChanger() {
        var _ru = "Ё!\"№;%:?*()_+ЙЦУКЕНГШЩЗХЪ/ФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,ёйцукенгшщзхъ\\фывапролджэячсмитьбю.",
            _en = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?`qwertyuiop[]\\asdfghjkl;'zxcvbnm,./",
            currentLayout,
            translateToLayout;

        function initLayoutFromText(text) {

            var symbol, i, length, isRu, isEn;

            currentLayout = '';
            translateToLayout = '';

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
        this.initLayout = function(elements, from, to) {
            if (elements.length == 1) {
                if (initLayoutFromText(elements[0].textContent.substr(from, to - from))) {
                    return true;
                }

            } else {
                if (initLayoutFromText(elements[0].textContent.substr(from))) {
                    return true;
                }

                for (var i = 1; i < elements.length - 1; i++) {
                    if (initLayoutFromText(elements[i].textContent)) {
                        return true;
                    }

                }

                if (initLayoutFromText(elements[elements.length - 1].textContent.substr(0, to))) {
                    return true;
                }

            }

            return false;
        };

        this.change = function(text) {
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
            if (elements.length == 1) {
                return selection.anchorOffset < selection.focusOffset;
            }

            return elements.indexOf(selection.anchorNode) < elements.indexOf(selection.focusNode);
        }

        /**
         * @return Object{startOffset,endOffset,elements, originSelection}
         */
        this.getSelection = function() {
            var selection = window.getSelection(),
                range = selection.getRangeAt(0),
                parent = range.commonAncestorContainer,
                elements = htmlUtils.getAllTextChilds(parent),
                startOffset,
                endOffset,
                startElement,
                endElement,
                selectedFromTop;

            elements = elements.filter(function(el) {
                if (selection.containsNode(el, true)) {
                    return true;
                }
            });

            selectedFromTop = isFromTopSelection(selection, elements);

            startElement = selectedFromTop ? selection.anchorNode : selection.focusNode;
            endElement = selectedFromTop ? selection.focusNode : selection.anchorNode;

            startOffset = htmlUtils.isValidElement(startElement) ?
                (selectedFromTop ? selection.anchorOffset : selection.focusOffset) : 0;
            endOffset = htmlUtils.isValidElement(endElement) ?
                (selectedFromTop ? selection.focusOffset : selection.anchorOffset) : Number.MAX_SAFE_INTEGER; //TODO
                                                                                                              // use
                                                                                                              // element
                                                                                                              // real
                                                                                                              // length

            return {
                origin: selection,
                elements: elements,
                startOffset: startOffset,
                endOffset: endOffset
            }
        }
    }

    function HtmlUtils() {
        function recurcyGetTextChilds(el, childs, self) {
            var i, child;

            if (!el.childNodes.length) {
                if (self.isValidElement(el)) {
                    childs.push(el);
                }
                return;
            }

            for (i = 0; i < el.childNodes.length; i++) {
                child = el.childNodes[i];

                if (!child.childNodes.length) {
                    if (self.isValidElement(child)) {
                        childs.push(child);
                    }
                } else {
                    recurcyGetTextChilds(child, childs, self);
                }
            }
        }

        this.getAllTextChilds = function(el) {
            var childs = [];

            recurcyGetTextChilds(el, childs, this);
            return childs;
        };

        //TODO
        this.isValidElement = function(el) {
            return el.nodeType === 3 && ( //only text element
                el.parentNode.className == 'im_msg_text' || // sended message
                el.parentNode.className == 'im_editable' || // message input
                el.parentNode.parentNode.className == 'im_editable' || // next line message input

                el.parentNode.className == 'wall_post_text' || // sended wall post
                el.parentNode.className == 'wall_reply_text' || // sended wall comment
                el.parentNode.className == 'fl_l reply_field' || // wall comment input
                el.parentNode.parentNode.className == 'fl_l reply_field' || // next line wall comment input

                el.parentNode.className == 'pv_commtext' || // sended photo comment
                el.parentNode.id == 'pv_comment' || // photo comment input
                el.parentNode.parentNode.id == 'pv_comment' || // next line photo comment input

                el.parentNode.className == 'mv_commtext' || // sended photo comment
                el.parentNode.id == 'mv_comment' || // photo comment input
                el.parentNode.parentNode.id == 'mv_comment' // next line photo comment input
                );
        };
    }

    function Replacer() {
        function _replaceText(text) {
            return layoutChanger.change(text);
        }

        this.replaceTextInElement = function(el, from, to) {
            var text = el.textContent,
                from = from === undefined ? 0 : from,
                to = to === undefined ? text.length : to;

            el.textContent = text.substr(0, from) + _replaceText(text.substr(from, to - from)) + text.substr(to, text.length);
        }
    }

    function replaceText() {
        var sel = selection.getSelection();
        if (sel.elements.length && layoutChanger.initLayout(sel.elements, sel.startOffset, sel.endOffset)) {
            if (sel.elements.length == 1) {
                replacer.replaceTextInElement(sel.elements[sel.elements.length - 1], sel.startOffset, sel.endOffset);
            } else {
                replacer.replaceTextInElement(sel.elements[0], sel.startOffset);
                for (var i = 1; i < sel.elements.length - 1; i++) {
                    replacer.replaceTextInElement(sel.elements[i]);
                }
                replacer.replaceTextInElement(sel.elements[sel.elements.length - 1], 0, sel.endOffset);
            }
            sel.origin.removeAllRanges();
        }
    }

    (function init() {
        layoutChanger = new LayotChanger();
        selection = new Selection();
        replacer = new Replacer();
        htmlUtils = new HtmlUtils();

        chrome.runtime.onMessage.addListener(
            function(request) {
                if (request.message === "change_layout") {
                    replaceText();
                }
            }
        );
    })();

})(chrome);
