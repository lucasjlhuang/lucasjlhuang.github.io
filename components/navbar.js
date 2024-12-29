const nav = document.getElementsByTagName('lucasnav')[0];
nav.innerHTML = `
        <header>
            <nav class="row">
                <div id="logo-container" class="col-1">
                    <img id="site-logo" src="/images/web-icon.png" alt="Site logo">
                </div>
                <div id="navbar-container" class="col-10">
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/pages/LucasHuangResume.pdf" target="blank">Resume</a></li>
                        <li><a href="/pages/playground/index.html" target="blank">Playground</a><li>
                        <li><a href="https://www.linkedin.com/in/lucasjlhuang" target="blank">Linkedin</a></li>
                    </ul>
                </div>
                <div id="logo-container" class="col-1">
                <img id="site-logo-2" src="/images/web-icon.png" alt="Site logo">
            </div>
            </nav>
        </header>
        `