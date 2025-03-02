/* 
 load_templates.js
 - Contains the HTML for nav & footer directly in template strings
 - Replaces placeholders (#nav_placeholder, #footer_placeholder) with that HTML
 - Wires up the dropdown menu once inserted
 - Uses snake_case and no semicolons as requested
*/

const nav_html = `
<nav>
  <div id="nav-wrapper">
    <div class="nav-left">
      <p><b>Vector demos</b></p>
    </div>
    <div class="nav-right">
      <select id="page-selector">
        <option data-page="index.html" value="home">Home</option>
        <option data-page="projections.html" value="projections">Vector projections</option>
        <option data-page="triangle.html" value="triangle">Triangle geometric proof</option>
        <option data-page="quad.html" value="quad">Quadrilateral geometric proof</option>
      </select>
    </div>
  </div>
</nav>
`

const footer_html = `
<footer>
  <p>Made with ❤️ by Otto Yang</p>
  <p>Honourable mention to my three <s>slaves</s> helpful assistants: ChatGPT, Claude 3.7 Sonnet and Github Copilot.</p>
  <p>Source code available <a target="_blank" href="https://github.com/skid-dev/8---Vector-visualiser">on Github</a></p>
</footer>
`

document.addEventListener("DOMContentLoaded", () => {
    load_templates()
})

function load_templates() {
    // Inject the nav HTML into #nav_placeholder
    let nav_placeholder = document.getElementById("nav_placeholder")
    if (nav_placeholder) {
        nav_placeholder.innerHTML = nav_html
        // Now that the nav is inserted, attach the event listener for the dropdown
        let page_selector = document.getElementById("page-selector")
        if (page_selector) {
            page_selector.addEventListener("change", handle_page_selection)
        }
    }

    // Inject the footer HTML into #footer_placeholder
    let footer_placeholder = document.getElementById("footer_placeholder")
    if (footer_placeholder) {
        footer_placeholder.innerHTML = footer_html
    }

    // if the update_plot function is defined, call it
    if (typeof update_plot === "function") {
        update_plot()
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let this_page = window.location.pathname.split("/").pop()
    let page_selector = document.getElementById("page-selector")
    if (page_selector) {
        for (let option of page_selector.options) {
            let page = option.getAttribute("data-page")
            if (page === this_page) {
                option.selected = true
                break
            }
        }
    }
})

function handle_page_selection() {
    let page_selector = document.getElementById("page-selector")

    // Redirect to the selected page
    let selected_option = page_selector.selectedOptions[0]
    let page = selected_option.getAttribute("data-page")
    window.location.href = page
}
