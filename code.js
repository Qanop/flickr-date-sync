FlickrSync = class FlickrSync {
    settings = {
        waitTimeout: 100,
        waitTimeoutPhotoSelect: 350,
        alertNoPhotosSelected: 'No photos selected to sync dates'
    }

    elementPaths = {
        sortMenu: 'div[class~=filter-sort]',
        sortMenuByTakenTime: 'div[class=body] ul[role=menu] li:nth-child(1)',
        photos: 'div[class~=cameraroll-item-placeholder]',
        selectionPanel: 'div[class="view cameraroll-tray-view"]',
        selectionPanelHidden: 'div[class="view cameraroll-tray-view none"]',
        editFormDialog: 'cameraroll-edit-dialog',
        editButton: 'div[class~=edit-selected-photos]',
        timeInputs: 'div[class~=time-fields] input',
        saveButtons: 'div[class~=button-container] button:nth-child(2)',
        clearSelections: 'a[class~=done-with-tray-selection]',
        selectedPhotosPanel: 'div[class=cameraroll-tray] div',
        nextPhotosOnSelectionPanel: 'div[class="load-next-selection"]',
        takenAtYear: 'div[class~=date-taken-inputs] div[data-year]',
        takenAtMonth: 'div[class~=date-taken-inputs] div[data-monthname]',
        takenAtDay: 'div[class~=date-taken-inputs] div[data-day]',
        uploadedAtYear: 'div[class~=date-posted-inputs] div[data-year]',
        uploadedAtMonth: 'div[class~=date-posted-inputs] div[data-monthname]',
        uploadedAtDay: 'div[class~=date-posted-inputs] div[data-day]',
    }

    elementAttributes = {
        editFormDay: 'data-day',
        editFormMonth: 'data-monthname',
        editFormYear: 'data-year',
    }

    async run() {
        await this.__flickrSync();
        return this;
    }

    async prepare() {
        (await this.__getElement(this.elementPaths.sortMenu)).click();
        (await this.__getElement(this.elementPaths.sortMenuByTakenTime)).click();
        await this.__sleep(5000);
        return this;
    }

    async __getElementsFromSelectionPanel() {
        let Ids = []
        if ((await this.__selectorExists(this.elementPaths.selectionPanel, 300)) === false) {
            alert(this.settings.alertNoPhotosSelected)
            return Ids;
        }

        while ((await this.__selectorExists(this.elementPaths.nextPhotosOnSelectionPanel, 500))) {
            // Click - load next photos on tray
            (await this.__getElement(this.elementPaths.nextPhotosOnSelectionPanel)).click();
            await this.__sleep(1000);
        }
        let elements = await this.__getElements(this.elementPaths.selectedPhotosPanel, 500)

        // Cast NodeList -> Array
        elements = Array.prototype.slice.call(elements)

        for (const element of elements) {
            let realElement = await this.__getElement('div[data-guid="' + element.getAttribute('data-guid') + '"]')
            Ids.push(realElement.getAttribute('data-id'));
        }

        return Ids;
    }

    async __flickrSync() {
        let elementIds = await this.__getElementsFromSelectionPanel();
        if (elementIds.length === 0) {
            return;
        }

        (await this.__getElement(this.elementPaths.clearSelections)).click();
        await this.__sleep(500);

        for (const elementGUId of elementIds) {
            // Click photo and check if selection panel prompts
            let element = await this.__getElement('div[data-id="' + elementGUId + '"]')
            element.click();
            (await this.__selectorExists(this.elementPaths.selectionPanel));
            await this.__sleep(500);

            // Enter edit form
            (await this.__getElement(this.elementPaths.editButton)).click();
            await this.__sleep(500);

            // Copy input values
            let timeInputElements = (await this.__getElements(this.elementPaths.timeInputs));
            timeInputElements[3].value = timeInputElements[0].value;
            timeInputElements[4].value = timeInputElements[1].value;
            timeInputElements[5].value = timeInputElements[2].value;


            // Sync date
            let dayTakenAt = await this.__getElement(this.elementPaths.takenAtDay);
            let dayUploadedAt = await this.__getElement(this.elementPaths.uploadedAtDay);
            let monthTakenAt = await this.__getElement(this.elementPaths.takenAtMonth);
            let monthUploadedAt = await this.__getElement(this.elementPaths.uploadedAtMonth);
            let yearTakenAt = await this.__getElement(this.elementPaths.takenAtYear);
            let yearUploadedAt = await this.__getElement(this.elementPaths.uploadedAtYear);

            // Sync day if different
            if (dayTakenAt.getAttribute(this.elementAttributes.editFormDay) !== dayUploadedAt.getAttribute(this.elementAttributes.editFormDay)) {
                dayUploadedAt.click()
                await this.__sleep(200);
                (await this.__getElement('div[class="date-dropdown"] ul li[value="' + dayTakenAt.getAttribute(this.elementAttributes.editFormDay) + '"]')).click();
            }

            // Sync month if different
            if (monthTakenAt.getAttribute(this.elementAttributes.editFormMonth) !== monthUploadedAt.getAttribute(this.elementAttributes.editFormMonth)) {
                monthUploadedAt.click()
                await this.__sleep(200);
                (await this.__getElement('div[class="date-dropdown"] ul li[value="' + monthTakenAt.getAttribute(this.elementAttributes.editFormMonth) + '"]')).click();
            }

            // Sync year if different
            if (yearTakenAt.getAttribute(this.elementAttributes.editFormYear) !== yearUploadedAt.getAttribute(this.elementAttributes.editFormYear)) {
                yearUploadedAt.click()
                await this.__sleep(200);
                (await this.__getElement('div[class="date-dropdown"] ul li[value="' + yearTakenAt.getAttribute(this.elementAttributes.editFormYear) + '"]')).click();
            }

            // Save form
            (await this.__getElement(this.elementPaths.saveButtons)).click();

            // Wait for close form
            (await this.__selectorNotExists(this.elementPaths.editFormDialog));
            await this.__sleep(2500);

            // Clear selection
            (await this.__getElement(this.elementPaths.clearSelections)).click();
            (await this.__selectorExists(this.elementPaths.selectionPanelHidden));
            await this.__sleep(250);
        }
    }

    async __getElements(selector = '', waitTime = 10000) {
        let time = 0
        while (time < waitTime) {
            if (document.querySelector(selector) === null) {
                await this.__sleep(this.settings.waitTimeout);
                time += this.settings.waitTimeout;
            } else {
                return document.querySelectorAll(selector);
            }
        }
        return []
    }

    async __getElement(selector = '', waitTime = 10000) {
        const elements = await this.__getElements(selector, waitTime);
        return elements.length === 0 ? null : elements[0];
    }

    async __sleep(ms = 300) {
        await new Promise(r => setTimeout(r, ms));
    }

    async __selectorExists(selector = '', waitTime = 10000) {
        return (await this.__getElements(selector, waitTime)).length !== 0;
    }

    async __selectorNotExists(selector = '', waitTime = 10000) {
        let time = 0
        while (time < waitTime) {
            if (document.querySelector(selector) !== null) {
                await new Promise(r => setTimeout(r, this.settings.waitTimeout));
                time += this.settings.waitTimeout;
            } else {
                return true
            }
        }
        return false
    }

    async __typeToInput(element, value) {
        element.value = value;
    }
}

new FlickrSync().run().then(r => r)
