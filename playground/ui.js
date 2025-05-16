function setup() {
    let canvas = createCanvas(windowWidth - 300, windowHeight)
    canvas.parent('canvas_container')

    autocomplete_container = document.getElementById('autocomplete_container')
    autocomplete_suggestions = document.getElementById('autocomplete_suggestions')
    autocomplete_error = document.getElementById('autocomplete_error')
    mirror_div = document.getElementById('input_mirror')

    let input = document.getElementById('vector_input')
    input.addEventListener('keydown', (event) => {
        let full_str = input.value
        let caretPos = input.selectionEnd || full_str.length
        let { tokenText } = get_current_token(full_str, caretPos)
        if (event.key === 'Enter') {
            event.preventDefault()
            add_expression_if_valid()
        } else if (event.key === 'Tab') {
            if (current_suggestions.length > 0) {
                event.preventDefault()
                let chosen = current_suggestions[selected_suggestion_index]
                replace_last_token_with(chosen)
                hide_autocomplete()
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            selected_suggestion_index++
            if (selected_suggestion_index >= current_suggestions.length) {
                selected_suggestion_index = current_suggestions.length - 1
            }
            render_autocomplete_list(tokenText)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            selected_suggestion_index--
            if (selected_suggestion_index < 0) {
                selected_suggestion_index = 0
            }
            render_autocomplete_list(tokenText)
        }
    })

    input.addEventListener('input', () => {
        validate_current_input()
        update_autocomplete()
    })

    document.addEventListener('mousedown', (e) => {
        let input_box = document.getElementById('vector_input')
        if (!autocomplete_container.contains(e.target) && e.target != input_box) {
            hide_autocomplete()
        }
    })
}

function windowResized() {
    resizeCanvas(windowWidth - 300, windowHeight)
}

function draw() {
    background(255)
    let bbox = compute_bounding_box()
    setup_view(bbox)
    draw_grid(bbox)
    draw_axes()
    draw_axis_labels(bbox)
    draw_axis_ticks(bbox)
    draw_items()
}

document.getElementById('add_vector_button').addEventListener('click', add_expression_if_valid)

function add_expression_if_valid() {
    let error_msg = validate_current_input()
    if (error_msg) return
    let input_str = document.getElementById('vector_input').value.trim()
    if (!input_str) return
    parse_and_store(input_str)
    render_items_list()
    document.getElementById('vector_input').value = ''
    autocomplete_error.textContent = ''
    hide_autocomplete()
    validate_current_input()
}

function validate_current_input() {
    let input_str = document.getElementById('vector_input').value.trim()
    let add_button = document.getElementById('add_vector_button')
    if (!input_str) {
        autocomplete_error.textContent = ''
        add_button.disabled = true
        return 'Empty'
    }
    let error_msg = test_parse_expression(input_str)
    if (error_msg) {
        autocomplete_error.textContent = error_msg
        add_button.disabled = true
    } else {
        autocomplete_error.textContent = ''
        add_button.disabled = false
    }
    return error_msg
}

function render_items_list() {
    let container = document.getElementById('items_list')
    container.innerHTML = ''
    for (let it of items) {
        let entry = document.createElement('div')
        entry.className = 'item_entry'
        if (it.type === 'point') {
            let t = document.createElement('div')
            t.className = 'item_title'
            t.textContent = 'Point ' + it.label
            entry.appendChild(t)
            let inf = document.createElement('div')
            inf.textContent = `Coordinates: (${it.x}, ${it.y})`
            entry.appendChild(inf)
        } else if (it.type === 'vectorExp') {
            let t = document.createElement('div')
            t.className = 'item_title'
            t.textContent = 'Vector Expression: ' + it.expression
            entry.appendChild(t)
            let idx = 1
            for (let s of it.segments) {
                let seg_desc = document.createElement('div')
                seg_desc.className = 'segment_description'
                seg_desc.style.color = s.color
                seg_desc.textContent = `Segment #${idx}: from (${s.sx}, ${s.sy}) to (${s.ex}, ${s.ey}) [${s.label}]`
                entry.appendChild(seg_desc)
                idx++
            }
        }
        container.appendChild(entry)
    }
}
