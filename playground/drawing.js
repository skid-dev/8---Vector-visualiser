function compute_bounding_box() {
    if (items.length === 0) {
        return { min_x: -1, max_x: 1, min_y: -1, max_y: 1 }
    }
    let min_x = Infinity,
        max_x = -Infinity
    let min_y = Infinity,
        max_y = -Infinity
    for (let it of items) {
        if (it.type === 'point') {
            let x = it.x,
                y = it.y
            if (x < min_x) min_x = x
            if (x > max_x) max_x = x
            if (y < min_y) min_y = y
            if (y > max_y) max_y = y
        } else if (it.type === 'vectorExp') {
            for (let seg of it.segments) {
                let vx1 = seg.sx,
                    vy1 = seg.sy
                let vx2 = seg.ex,
                    vy2 = seg.ey
                if (vx1 < min_x) min_x = vx1
                if (vx1 > max_x) max_x = vx1
                if (vy1 < min_y) min_y = vy1
                if (vy1 > max_y) max_y = vy1
                if (vx2 < min_x) min_x = vx2
                if (vx2 > max_x) max_x = vx2
                if (vy2 < min_y) min_y = vy2
                if (vy2 > max_y) max_y = vy2
            }
        }
    }
    if (min_x === Infinity || max_x === -Infinity) {
        return { min_x: -1, max_x: 1, min_y: -1, max_y: 1 }
    }
    return { min_x, max_x, min_y, max_y }
}

function setup_view(bbox) {
    let w = width,
        h = height
    let margin = 40
    let bbw = bbox.max_x - bbox.min_x
    let bbh = bbox.max_y - bbox.min_y
    if (bbw < 0.0001) bbw = 1
    if (bbh < 0.0001) bbh = 1
    let scale_x = (w - 2 * margin) / bbw
    let scale_y = (h - 2 * margin) / bbh
    let new_scale = Math.min(scale_x, scale_y)
    if (!isFinite(new_scale) || new_scale <= 0) new_scale = 50
    scale_factor = new_scale
    let cx = (bbox.min_x + bbox.max_x) / 2
    let cy = (bbox.min_y + bbox.max_y) / 2
    origin_x = w / 2 - cx * scale_factor
    origin_y = h / 2 + cy * scale_factor
}

function draw_grid(bbox) {
    stroke(220)
    strokeWeight(1)
    noFill()
    let min_xi = Math.floor(bbox.min_x),
        max_xi = Math.ceil(bbox.max_x)
    let min_yi = Math.floor(bbox.min_y),
        max_yi = Math.ceil(bbox.max_y)
    for (let gx = min_xi; gx <= max_xi; gx++) {
        let sx = origin_x + gx * scale_factor
        let sy1 = origin_y - min_yi * scale_factor
        let sy2 = origin_y - max_yi * scale_factor
        line(sx, sy1, sx, sy2)
    }
    for (let gy = min_yi; gy <= max_yi; gy++) {
        let sy = origin_y - gy * scale_factor
        let sx1 = origin_x + min_xi * scale_factor
        let sx2 = origin_x + max_xi * scale_factor
        line(sx1, sy, sx2, sy)
    }
}

function draw_axes() {
    stroke(0)
    strokeWeight(2)
    line(0, origin_y, width, origin_y)
    line(origin_x, 0, origin_x, height)
}

function draw_axis_labels(bbox) {
    fill(0)
    noStroke()
    textSize(16)
    textAlign(CENTER, CENTER)
    let lx = bbox.max_x > 0 ? bbox.max_x : bbox.min_x
    let px = origin_x + lx * scale_factor + 30,
        py = origin_y
    text('X', px, py)
    let ly = bbox.max_y > 0 ? bbox.max_y : bbox.min_y
    let qx = origin_x
    let qy = origin_y - ly * scale_factor - 20
    text('Y', qx, qy)
}

function draw_axis_ticks(bbox) {
    stroke(0)
    strokeWeight(1)
    fill(0)
    textSize(12)
    let x_range = bbox.max_x - bbox.min_x
    let y_range = bbox.max_y - bbox.min_y
    let x_step = pick_label_step(x_range)
    let y_step = pick_label_step(y_range)

    textAlign(CENTER, TOP)
    let min_xi = Math.floor(bbox.min_x),
        max_xi = Math.ceil(bbox.max_x)
    for (let x = min_xi; x <= max_xi; x += x_step) {
        let sx = origin_x + x * scale_factor
        let sy = origin_y
        line(sx, sy - 5, sx, sy + 5)
        text(x, sx, sy + 5)
    }
    textAlign(RIGHT, CENTER)
    let min_yi = Math.floor(bbox.min_y),
        max_yi = Math.ceil(bbox.max_y)
    for (let y = min_yi; y <= max_yi; y += y_step) {
        let sy = origin_y - y * scale_factor
        let sx = origin_x
        line(sx - 5, sy, sx + 5, sy)
        text(y, sx - 7, sy)
    }
}

function pick_label_step(range_val) {
    let ideal = 10
    let raw = range_val / ideal
    return choose_nice_step(raw)
}

function choose_nice_step(x) {
    let possible = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
    for (let st of possible) {
        if (st >= x) {
            if (st < 1) return 1
            return st
        }
    }
    return 1000
}

function draw_items() {
    for (let it of items) {
        if (it.type === 'point') draw_point_item(it)
        else if (it.type === 'vectorExp') draw_vector_exp_item(it)
    }
}

function draw_point_item(it) {
    let sx = origin_x + it.x * scale_factor
    let sy = origin_y - it.y * scale_factor
    fill(255, 0, 0)
    noStroke()
    circle(sx, sy, 8)
    fill(0)
    textSize(14)
    textAlign(LEFT, CENTER)
    text(it.label, sx + 10, sy)
}

function draw_vector_exp_item(it) {
    for (let seg of it.segments) {
        let sx = origin_x + seg.sx * scale_factor
        let sy = origin_y - seg.sy * scale_factor
        let ex = origin_x + seg.ex * scale_factor
        let ey = origin_y - seg.ey * scale_factor
        stroke(seg.color)
        strokeWeight(2)
        line(sx, sy, ex, ey)
        push()
        translate(ex, ey)
        let angle = atan2(sy - ey, sx - ex)
        rotate(angle)
        stroke(seg.color)
        fill(seg.color)
        let arrow_size = 7
        line(0, 0, arrow_size, arrow_size / 2)
        line(0, 0, arrow_size, -arrow_size / 2)
        pop()
    }
}
