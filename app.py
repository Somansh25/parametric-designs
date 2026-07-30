import os
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    """Renders the main mathematical canvas application interface."""
    return render_template("index.html")

if __name__ == "__main__":
    # Compatible with Google Cloud Shell Web Preview (default port 8080)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
