function parse_vec_label(str) {
    let s = str.replace(/\s+/g, '')
    s = s.replace(/\\vec\{/g, '')
    s = s.replace(/\}/g, '')
    if (s.length < 2) return null
    let a = s.charAt(0)
    let b = s.charAt(1)
    return { a_label: a, b_label: b }
}

function parse_and_store(expr_str) {
    if (is_vector_definition(expr_str)) {
        parse_vector_definition(expr_str)
    } else if (is_fraction_expr(expr_str)) {
        let item = parse_fraction_expr(expr_str)
        if (item) items.push(item)
    } else if (expr_str.includes('=')) {
        define_point_item(expr_str)
    } else {
        let ve = parse_vector_expression(expr_str)
        if (ve) items.push(ve)
    }
}

function parse_vector_definition(full_str) {
    let parts = full_str.split('=')
    if (parts.length !== 2) return
    let left_side = parts[0].trim()
    let right_side = parts[1].trim()

    let named = parse_vec_label(left_side)
    if (!named) return
    let A_label = named.a_label
    let E_label = named.b_label

    let displacement = parse_any_vector_expression_as_dxdy(right_side)
    if (!displacement) return

    if (!points_dict[A_label]) {
        return
    }
    let Ax = points_dict[A_label].x
    let Ay = points_dict[A_label].y

    let Ex = Ax + displacement.dx
    let Ey = Ay + displacement.dy

    points_dict[E_label] = { x: Ex, y: Ey }
    let existing_item = items.find((it) => it.type === 'point' && it.label === E_label)
    if (!existing_item) {
        items.push({
            type: 'point',
            label: E_label,
            x: Ex,
            y: Ey,
        })
    } else {
        existing_item.x = Ex
        existing_item.y = Ey
    }
}

function parse_any_vector_expression_as_dxdy(expr_str) {
    if (is_fraction_expr(expr_str)) {
        let item = parse_fraction_expr(expr_str)
        if (!item) return null
        let dxdy = final_displacement_of_vectorExp(item)
        return dxdy
    } else if (expr_str.includes('=')) {
        return null
    } else {
        let item = parse_vector_expression(expr_str)
        if (!item) return null
        let dxdy = final_displacement_of_vectorExp(item)
        return dxdy
    }
}

function final_displacement_of_vectorExp(item) {
    if (item.segments.length === 0) return { dx: 0, dy: 0 }
    let sx0 = item.segments[0].sx
    let sy0 = item.segments[0].sy
    let last = item.segments[item.segments.length - 1]
    let exN = last.ex
    let eyN = last.ey
    let dx = exN - sx0
    let dy = eyN - sy0
    return { dx, dy }
}

function parse_fraction_expr(expr_str) {
    let match = expr_str.match(/\\frac\{(.*?)\}\{(.*?)\}/)
    if (!match) return null
    let numerator = match[1].trim()
    let den_str = match[2].trim()
    let den_val = parseFloat(den_str)
    if (isNaN(den_val) || Math.abs(den_val) < 1e-12) return null
    let numerator_item = parse_vector_expression(numerator)
    if (!numerator_item) return null

    let new_item = {
        type: 'vectorExp',
        expression: expr_str,
        segments: [],
    }
    let sc = 1 / den_val
    let seg_in = numerator_item.segments
    if (seg_in.length === 0) return null

    let disps = []
    for (let s of seg_in) {
        let dx = s.ex - s.sx
        let dy = s.ey - s.sy
        disps.push({ dx, dy, label: s.label })
    }
    let sx0 = seg_in[0].sx
    let sy0 = seg_in[0].sy
    let cx = sx0,
        cy = sy0
    for (let d of disps) {
        let ndx = d.dx * sc
        let ndy = d.dy * sc
        let nx = cx + ndx
        let ny = cy + ndy
        new_item.segments.push({
            sx: cx,
            sy: cy,
            ex: nx,
            ey: ny,
            label: d.label,
            color: get_next_color(),
        })
        cx = nx
        cy = ny
    }
    if (disps.length > 1) {
        new_item.segments.push({
            sx: sx0,
            sy: sy0,
            ex: cx,
            ey: cy,
            label: 'Fraction Sum',
            color: get_next_color(),
        })
    }
    return new_item
}

function define_point_item(def_str) {
    let parts = def_str.split('=')
    if (parts.length !== 2) return
    let label = parts[0].trim()
    let coords_str = parts[1].trim()
    let coords = parse_position_vector(coords_str)
    if (!coords) return

    points_dict[label] = { x: coords.x, y: coords.y }
    items.push({
        type: 'point',
        label,
        x: coords.x,
        y: coords.y,
    })
}

function parse_vector_expression(expr) {
    let item = {
        type: 'vectorExp',
        expression: expr,
        segments: [],
    }
    let terms = expr.split('+').map((t) => t.trim())
    if (terms.length === 0) return null

    let parsed_terms = []
    for (let t of terms) {
        let info = parse_vector_term_info(t)
        if (!info) return null
        parsed_terms.push(info)
    }
    if (parsed_terms.length === 1) {
        let s = parsed_terms[0]
        item.segments.push({
            sx: s.start_coords.x,
            sy: s.start_coords.y,
            ex: s.end_coords.x,
            ey: s.end_coords.y,
            color: get_next_color(),
            label: s.label,
        })
    } else {
        let first = parsed_terms[0]
        let sx0 = first.start_coords.x
        let sy0 = first.start_coords.y
        let cx = sx0,
            cy = sy0
        for (let p of parsed_terms) {
            let ex2 = cx + p.dx
            let ey2 = cy + p.dy
            item.segments.push({
                sx: cx,
                sy: cy,
                ex: ex2,
                ey: ey2,
                color: get_next_color(),
                label: p.label,
            })
            cx = ex2
            cy = ey2
        }
        item.segments.push({
            sx: sx0,
            sy: sy0,
            ex: cx,
            ey: cy,
            color: get_next_color(),
            label: 'Sum',
        })
    }
    return item
}

function parse_vector_term_info(term_str) {
    let named = parse_named_vector(term_str)
    if (named) {
        let dx = named.bx - named.ax
        let dy = named.by - named.ay
        return {
            dx,
            dy,
            start_coords: { x: named.ax, y: named.ay },
            end_coords: { x: named.bx, y: named.by },
            label: named.label,
        }
    }
    let coords = parse_position_vector(term_str)
    if (coords) {
        return {
            dx: coords.x,
            dy: coords.y,
            start_coords: { x: 0, y: 0 },
            end_coords: { x: coords.x, y: coords.y },
            label: term_str,
        }
    }
    return null
}

function parse_named_vector(str) {
    let s = str.replace(/\s+/g, '')
    s = s.replace(/\\vec\{/g, '')
    s = s.replace(/\}/g, '')
    if (s.length < 2) return null
    let a = s.charAt(0)
    let b = s.charAt(1)
    return {
        ax: points_dict[a] ? points_dict[a].x : 0,
        ay: points_dict[a] ? points_dict[a].y : 0,
        bx: points_dict[b] ? points_dict[b].x : 0,
        by: points_dict[b] ? points_dict[b].y : 0,
        point_a_label: a,
        point_b_label: b,
        label: '\\vec{' + a + b + '}',
    }
}

function parse_position_vector(str) {
    let s = str.toLowerCase().replace(/\s+/g, '')
    let m = s.match(/([+-]?\d*\.?\d*)i([+-]\d*\.?\d*)j/)
    if (!m) return null
    let x_str = m[1],
        y_str = m[2]
    if (x_str === '' || x_str === '+') x_str = '1'
    else if (x_str === '-') x_str = '-1'
    if (y_str === '' || y_str === '+') y_str = '1'
    else if (y_str === '-') y_str = '-1'
    let x = parseFloat(x_str),
        y = parseFloat(y_str)
    if (isNaN(x) || isNaN(y)) return null
    return { x, y }
}

function get_next_color() {
    let c = color_array[color_index % color_array.length]
    color_index++
    return c
}

function test_parse_vector_expr(expr) {
    let terms = expr.split('+').map((t) => t.trim())
    if (terms.length === 0) {
        return 'No valid expression'
    }
    for (let t of terms) {
        let check = test_parse_vector_term(t)
        if (check) {
            return check
        }
    }
    return null
}

function test_parse_vector_term(term_str) {
    let named = parse_named_vector(term_str)
    if (named) {
        let a_label = named.point_a_label
        let b_label = named.point_b_label
        if (!points_dict[a_label]) {
            return `Point "${a_label}" is not defined`
        }
        if (!points_dict[b_label]) {
            return `Point "${b_label}" is not defined`
        }
        return null
    }
    let coords = parse_position_vector(term_str)
    if (coords) {
        return null
    }
    return `Unable to parse "${term_str}"`
}

function is_fraction_expr(s) {
    return /\\frac\{.*?\}\{.*?\}/.test(s)
}

function test_parse_point(def_str) {
    let parts = def_str.split('=')
    if (parts.length !== 2) {
        return 'Invalid point definition (use A = 2i + 3j)'
    }
    let label = parts[0].trim()
    if (!label) {
        return 'Missing point label'
    }
    let coords_str = parts[1].trim()
    let coords = parse_position_vector(coords_str)
    if (!coords) {
        return 'Invalid coordinates for point'
    }
    return null
}

function test_parse_fraction_expr(expr_str) {
    let match = expr_str.match(/\\frac\{(.*?)\}\{(.*?)\}/)
    if (!match) {
        return 'Invalid fraction syntax; expected \\frac{...}{...}'
    }
    let numerator = match[1].trim()
    let denominator_str = match[2].trim()
    let num_err = test_parse_vector_expr(numerator)
    if (num_err) {
        return 'Fraction numerator error: ' + num_err
    }
    let denominator_val = parseFloat(denominator_str)
    if (isNaN(denominator_val)) {
        return 'Fraction denominator must be a number'
    }
    if (Math.abs(denominator_val) < 1e-12) {
        return 'Fraction denominator cannot be zero'
    }
    return null
}

function test_parse_expression(expr_str) {
    if (is_vector_definition(expr_str)) {
        return test_parse_vector_definition(expr_str)
    }
    if (is_fraction_expr(expr_str)) {
        let frac_err = test_parse_fraction_expr(expr_str)
        return frac_err
    }
    if (expr_str.includes('=')) {
        return test_parse_point(expr_str)
    }
    return test_parse_vector_expr(expr_str)
}

function is_vector_definition(s) {
    return s.includes('\\vec{') && s.includes('=')
}

function test_parse_vector_definition(expr_str) {
    let parts = expr_str.split('=')
    if (parts.length !== 2) {
        return 'Invalid vector definition (use \\vec{XY} = someVectorExpr)'
    }
    let left_side = parts[0].trim()
    let right_side = parts[1].trim()
    let named = parse_vec_label(left_side)
    if (!named) {
        return 'Left side must be \\vec{XY}'
    }
    let X = named.a_label
    if (!points_dict[X]) {
        return `Point "${X}" not defined.`
    }
    let err_msg = test_parse_expression(right_side)
    if (err_msg) {
        return `Right side error: ${err_msg}`
    }
    return null
}
