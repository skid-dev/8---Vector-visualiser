/* Global variables for the vector playground */
let points_dict = {}
let items = []
let color_array = ["#e6194b", "#3cb44b", "#0082c8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#ffe119"]
let color_index = 0

let scale_factor = 50
let origin_x
let origin_y

let autocomplete_container
let autocomplete_suggestions
let autocomplete_error
let mirror_div
let current_suggestions = []
let selected_suggestion_index = 0
const MAX_SUGGESTIONS = 5

const TOKEN_DELIMITERS = /(\s|\+|-|\(|\))/
