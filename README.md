# Safebrowse Firefox Plugin

This is a Firefox plugin that uses the Safebrowse API to check some characteristics of the URLs you are visiting.

## Installation

First, you will pack the plugin using the command below (in the root of the repository):

```bash
zip -r ../safebrowse-extension.xpi *
```

Then, you can add it to `about:debugging` by clicking on "Load Temporary Add-on" and selecting the `safebrowse-extension.xpi` file.

Now, every time you visit a URL, the plugin will show:

- [x] Thirdparty connections made by the website

- [x] The data storage at the user's device

- [x] The cookies used by browser (first-party, third-party, session and persistent)

- [ ] Potential browser hijacking

- [ ] Canvas fingerprinting detection

- [x] Privacy score of the website