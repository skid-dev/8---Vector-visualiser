function update_autocomplete() {
    let input = document.getElementById('vector_input')
    let full_str = input.value
    let caretPos = input.selectionEnd || full_str.length
    let { tokenText } = get_current_token(full_str, caretPos)

    if (!tokenText) {
        hide_autocomplete()
        return
    }
    let suggestions = build_all_suggestions()
    let partial_lc = tokenText.toLowerCase()
    let filtered = [...suggestions].filter((sug) => sug.toLowerCase().includes(partial_lc))
    filtered.sort((a, b) => {
        let al = a.toLowerCase(),
            bl = b.toLowerCase()
        let a_st = al.startsWith(partial_lc)
        let b_st = bl.startsWith(partial_lc)
        if (a_st && !b_st) return -1
        if (!a_st && b_st) return 1
        return al.localeCompare(bl)
    })
    filtered = filtered.slice(0, MAX_SUGGESTIONS)

    if (filtered.length === 0) {
        let err = autocomplete_error.textContent.trim()
        if (err) {
            show_autocomplete_container()
            autocomplete_suggestions.innerHTML = ''
        } else {
            hide_autocomplete()
        }
        return
    }

    current_suggestions = filtered
    selected_suggestion_index = 0
    position_autocomplete_box()
    render_autocomplete_list(tokenText)
    show_autocomplete_container()
}

function render_autocomplete_list(tokenText) {
    autocomplete_suggestions.innerHTML = ''
    let partial_lc = tokenText.toLowerCase()
    current_suggestions.forEach((sug, idx) => {
        let div = document.createElement('div')
        div.className = 'autocomplete_item'
        if (idx === selected_suggestion_index) {
            div.classList.add('autocomplete_selected')
        }
        let leftPart = document.createElement('span')
        leftPart.innerHTML = highlight_partial(sug, partial_lc)
        let rightPart = document.createElement('span')
        rightPart.className = 'autocomplete_desc'
        rightPart.textContent = get_suggestion_description(sug)
        div.appendChild(leftPart)
        div.appendChild(rightPart)
        div.addEventListener('mousedown', () => {
            replace_last_token_with(sug)
            hide_autocomplete()
            validate_current_input()
        })
        autocomplete_suggestions.appendChild(div)
    })
}

function highlight_partial(suggestion, partial_lowercase) {
    let s_lower = suggestion.toLowerCase()
    let start_idx = s_lower.indexOf(partial_lowercase)
    if (start_idx < 0) return suggestion
    let end_idx = start_idx + partial_lowercase.length
    let prefix = suggestion.slice(0, start_idx)
    let match_text = suggestion.slice(start_idx, end_idx)
    let suffix = suggestion.slice(end_idx)
    return prefix + '<span class="highlight_match">' + match_text + '</span>' + suffix
}

function get_suggestion_description(sug) {
    if (sug === '\\frac') return 'Define fraction'
    if (sug === '\\frac{}{}') return 'Fraction snippet'
    if (sug.startsWith('\\vec{') && sug.length >= 6) {
        let inside = sug.slice(5, -1)
        return 'Vector ' + inside
    }
    if (points_dict[sug]) {
        return 'Point ' + sug
    }
    return 'Vector / expression'
}

function replace_last_token_with(new_text) {
    let input = document.getElementById('vector_input')
    let full_str = input.value
    let caretPos = input.selectionEnd || full_str.length
    let { tokenStart, tokenEnd } = get_current_token(full_str, caretPos)
    let before = full_str.slice(0, tokenStart)
    let after = full_str.slice(tokenEnd)
    input.value = before + new_text + after
    let newPos = before.length + new_text.length
    input.setSelectionRange(newPos, newPos)
}

function get_current_token(full_str, caretPos) {
    if (caretPos > full_str.length) caretPos = full_str.length
    let start = 0
    for (let i = caretPos - 1; i >= 0; i--) {
        if (TOKEN_DELIMITERS.test(full_str[i])) {
            start = i + 1
            break
        }
    }
    let end = caretPos
    let tokenText = full_str.slice(start, end)
    return { tokenStart: start, tokenEnd: end, tokenText }
}

function build_all_suggestions() {
    let setOfAll = new Set()
    for (let lbl in points_dict) setOfAll.add(lbl)
    let pkeys = Object.keys(points_dict)
    for (let i = 0; i < pkeys.length; i++) {
        for (let j = 0; j < pkeys.length; j++) {
            if (i === j) continue
            setOfAll.add(`\\vec{${pkeys[i]}${pkeys[j]}}`)
        }
    }
    setOfAll.add('\\frac')
    setOfAll.add('\\frac{}{}')
    return setOfAll
}

function hide_autocomplete() {
    autocomplete_container.style.display = 'none'
    current_suggestions = []
    selected_suggestion_index = 0
}

function show_autocomplete_container() {
    autocomplete_container.style.display = 'flex'
}

function position_autocomplete_box() {
    let input = document.getElementById('vector_input')
    let rect = get_caret_coordinates(input)
    if (!rect) {
        autocomplete_container.style.left = input.offsetLeft + 'px'
        autocomplete_container.style.top = input.offsetTop + input.offsetHeight + 'px'
        return
    }
    autocomplete_container.style.left = rect.left + 'px'
    autocomplete_container.style.top = rect.top + rect.height + 'px'
}

function get_caret_coordinates(input_el) {
    let selection_end = input_el.selectionEnd || 0
    let style = window.getComputedStyle(input_el)
    mirror_div.style.fontSize = style.fontSize
    mirror_div.style.fontFamily = style.fontFamily
    mirror_div.style.fontWeight = style.fontWeight
    mirror_div.style.letterSpacing = style.letterSpacing
    mirror_div.style.whiteSpace = 'pre-wrap'
    mirror_div.style.width = input_el.offsetWidth + 'px'
    mirror_div.style.padding = style.padding
    mirror_div.style.border = style.border
    mirror_div.style.boxSizing = style.boxSizing
    let text = input_el.value.substring(0, selection_end)
    text = text.replace(/\n/g, ' ')
    mirror_div.textContent = text
    let caret_span = document.createElement('span')
    caret_span.textContent = '|'
    mirror_div.appendChild(caret_span)
    let mirror_rect = mirror_div.getBoundingClientRect()
    let caret_rect = caret_span.getBoundingClientRect()
    let caret_left = caret_rect.left - mirror_rect.left
    let caret_top = caret_rect.top - mirror_rect.top
    return {
        left: mirror_div.offsetLeft + caret_left,
        top: mirror_div.offsetTop + caret_top,
        height: caret_span.offsetHeight,
    }
}
