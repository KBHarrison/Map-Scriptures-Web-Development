/*jslint browser: true*/
/*property
    Animation, DROP, LatLng, LatLngBounds, Marker, Point, Size, anchor,
    animation, books, classKey, clearTimeout, color, content, exec,
    extend, filter, fitBounds, fontWeight, forEach, fullName, getAttribute,
    getElementById, getElementsByClassName, getIds, google, gridName, hash,
    href, icon, id, includes, indexOf, init, innerHTML, label, labelOrigin, lat,
    length, lng, log, map, maps, maxBookId, minBookId, navigateChapter,
    nextChapter, numChapters, onHashChanged, onerror, onload, open, origin,
    panTo, parse, position, previousChapter, push, querySelectorAll, response,
    responseText, send, setMap, setTimeout, setZoom, showLocation, size, slice,
    split, status, text, tocName, url, volumes
*/
/*global
    document, location, google, XMLHttpRequest, window
*/
const Scriptures = (function () {
    "use strict";
/************************************Constants**********************************
*/
    const BOTTOM_PADDING = "<br /><br />";
    const CLASS_BOOKS = "books";
    const CLASS_CHAPTER = "chapter";
    const CLASS_VOLUME = "volume";
    const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
    const DIV_SCRIPTURES = "scriptures";
    const INDEX_PLACENAME = 2;
    const INDEX_LATITUDE = 3;
    const INDEX_LONGITUDE = 4;
    const INDEX_FLAG = 11;
    const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
    const MAX_RETRY_DELAY = 5000;
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const TAG_VOLUME_HEADER = "h5";
    const URL_BOOKS = "https://scriptures.byu.edu/mapscrip/model/books.php";
    const URL_SCRIPTURES = `https://scriptures.byu.edu/mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = "https://scriptures.byu.edu/mapscrip/model/volumes.php";
    const CLASS_BUTTON = "btn";
/****************************Private Variables**********************************
*/
    let books;
    let gmMarkers = [];
    let retryDelay = 500;
    let volumes;
/***************************Method Declaration**********************************
*/
    let addMarker;
    let addNavigationButtons;
    let ajax;
    let bookChapterValid;
    let booksGridContent;
    let booksGrid;
    let cacheBooks;
    let centerMap;
    let chaptersGrid;
    let chaptersGridContent;
    let clearMarkers;
    let encodedScripturesUrlParameters;
    let getIds;
    let getScripturesCallback;
    let getScripturesFailure;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlLink;
    let init;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let nextChapter;
    let onHashChanged;
    let previousChapter;
    let setupMarkers;
    let showLocation;
    let titleForBookChapter;
    let updateHash;
    let volumesGridContent;

/************************************Functions**********************************
*/
    addMarker = function (placename, latitude, longitude) {
        let duplicate = gmMarkers.filter(
            (marker) => (
                marker.position.lat() === Number(latitude) &&
                marker.position.lng() === Number(longitude)
            )
        )[0];
        if (!duplicate) {
            let marker = new google.maps.Marker({
                position: {lat: Number(latitude), lng: Number(longitude)},
                map,
                label: {
                    color: "black",
                    fontWeight: "bold",
                    text: placename
                },
                icon: {
                    labelOrigin: new google.maps.Point(11, 50),
                    url: "default_marker.png",
                    size: new google.maps.Size(22, 40),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(11, 40)
                },
                  // Code taken from
                  //https://stackoverflow.com/questions/5603623
                  // Custom icon taken from
                  //https://github.com/Concept211/Google-Maps-Markers
                animation: google.maps.Animation.DROP
            });
            gmMarkers.push(marker);
        } else {
            let duplicateIndex = gmMarkers.indexOf(duplicate);
            if (!gmMarkers[duplicateIndex].label.text.includes(placename)) {
                gmMarkers[duplicateIndex].label.text =
                gmMarkers[duplicateIndex].label.text + ", " + placename;
            }
        }
    };
    addNavigationButtons = function () {
        let navspace = document.getElementsByClassName("navspace")[0];
        let previousChapter = previousChapter(getIds()[1], getIds()[2]);
        let nextChapter = nextChapter(getIds()[1], getIds()[2]);
        console.log(previousChapter);
        console.log(nextChapter);
        if (previousChapter) {
            navspace.innerHTML = `
            <a id="backButton" href="javascript:void(0)" onclick="
            let previousChapter =
                Scriptures.previousChapter(
                        Scriptures.getIds()[1], Scriptures.getIds()[2]
                            );
            Scriptures.navigateChapter(previousChapter[0],previousChapter[1]);
            ">Back</a>`;
        }
        if (nextChapter) {
            navspace.innerHTML += `<a id="nextButton" href="javascript:void(0)" onclick="
            let nextChapter =
                Scriptures.nextChapter(
                    Scriptures.getIds()[1], Scriptures.getIds()[2]
                    );
            Scriptures.navigateChapter(nextChapter[0],nextChapter[1]);
            ">Next</a>`;
        }        
    };
    ajax = function (url, successCallback, failureCallback, skipJsonParse) {
        let request = new XMLHttpRequest();
        request.open(REQUEST_GET, url, true);
        request.onload = function () {
            if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                //There is literally no way to make this line work with jslint.
                let data = (
                    skipJsonParse
                    ? request.response
                    : JSON.parse(request.responseText)
                );
                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof failureCallback === "function") {
                    failureCallback(request);
                }

            }
        };
        request.onerror = failureCallback;

        request.send();
    };
    bookChapterValid = function (bookId, chapter) {
        let book = books[bookId];
        if (book === "undefined" || chapter < 0 || chapter > book.numChapters) {
            return false;
        }
        if (chapter === 0 && book.numChapters > 0) {
            return false;
        }
        return true;
    };
    booksGrid = function (volume) {
        return htmlDiv({
            classKey: CLASS_BOOKS,
            content: booksGridContent(volume)
        });
    };
    booksGridContent = function (volume) {
        let gridContent = "";
        volume.books.forEach(function (book) {
            gridContent += htmlLink({
                classKey: CLASS_BUTTON,
                id: book.id,
                href: `#${volume.id}:${book.id}`,
                content: book.gridName
            });
        });
        return gridContent;
    };
    cacheBooks = function (callback) {
        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }
            volume.books = volumeBooks;
        });
        if (typeof callback === "function") {
            callback();
        }
    };
    centerMap = function () {
        let bound = new google.maps.LatLngBounds();
        gmMarkers.forEach(function (marker) {
            if (marker.position.lat && marker.position.lng) {
                bound.extend(
                    new google.maps.LatLng(
                        Number(marker.position.lat()),
                        Number(marker.position.lng())
                    )
                );
            } else {
                console.log("ERROR: ", marker);
            }
        });
        // This code was modified from code posted by user Salman on
        //https://stackoverflow.com/questions/10634199
        map.fitBounds(bound);
    };
    chaptersGrid = function (book) {
        return htmlDiv({
            classKey: CLASS_VOLUME,
            content: htmlElement(TAG_VOLUME_HEADER, book.fullName)
        }) + htmlDiv({
            classKey: CLASS_BOOKS,
            content: chaptersGridContent(book)
        });
    };
    chaptersGridContent = function (book) {
        let gridContent = "";
        let chapter = 1;
        while (chapter <= book.numChapters) {
            gridContent += htmlLink({
                classKey: `${CLASS_BUTTON} ${CLASS_CHAPTER}`,
                id: chapter,
                href: `#0:${book.id}:${chapter}`,
                content: chapter
            });
            chapter += 1;
        }
        return gridContent;
    };
    clearMarkers = function () {
        gmMarkers.forEach(function (marker) {
            marker.setMap(null);
        });
        gmMarkers = [];
    };
    encodedScripturesUrlParameters = function (bookId, chapter, verses, isJst) {
        if (bookId !== undefined && chapter !== undefined) {
            let options = "";
            if (verses !== undefined) {
                options += verses;
            }
            if (isJst !== undefined) {
                options += "&jst=JST";
            }
            return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
        }
    };
    getIds = function () {
        let ids = [];
        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.slice(1).split(":");
        }
        return ids;
    };
    getScripturesCallback = function (chapterHtml) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;
        clearMarkers();
        setupMarkers();
        addNavigationButtons();
    };
    getScripturesFailure = function () {
        console.log("unable to retrieve chapter content from server.");
    };
    htmlAnchor = function (volume) {
        return `<a name="v${volume.id}" />`;
    };
    htmlDiv = function (parameters) {
        let classString = "";
        let contentString = "";
        let idString = "";

        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
        }

        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }

        if (parameters.id !== undefined) {
            classString = ` id="${parameters.id}"`;
        }

        return `<div${idString}${classString}>${contentString}</div>`;
    };
    htmlElement = function (tagName, content) {
        return `<${tagName}>${content}</${tagName}>`;
    };
    htmlLink = function (parameters) {
        let classString = "";
        let contentString = "";
        let hrefString = "";
        let idString = "";

        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
        }
        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }
        if (parameters.href !== undefined) {
            hrefString = ` href="${parameters.href}"`;
        }
        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }
        return `
        <a${idString}${classString}${hrefString}>${contentString}</a>
        `;
    };
    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;
        ajax(URL_BOOKS, function (data) {
            books = data;
            booksLoaded = true;
            if (volumesLoaded) {
                cacheBooks(callback);
            }
        });
        ajax(URL_VOLUMES, function (data) {
            volumes = data;
            volumesLoaded = true;
            if (booksLoaded) {
                cacheBooks(callback);
            }
        });
    };
    navigateBook = function (bookId) {
        let book = books[bookId];
        if (book.numChapters <= 1) {
            navigateChapter(book.id, book.numChapters);
        } else {
            document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
                id: DIV_SCRIPTURES_NAVIGATOR,
                content: chaptersGrid(book)
            });
        }
    };
    navigateChapter = function (bookId, chapter) {
        ajax(
            encodedScripturesUrlParameters(bookId, chapter),
            getScripturesCallback,
            getScripturesFailure,
            true
            );
        updateHash(bookId, chapter);
    };
    navigateHome = function (volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });
        clearMarkers();
        addMarker("Jerusalem", 31.7683, 35.2137);
        centerMap();
        map.setZoom(9);
        updateHash();
    };
    nextChapter = function (bookId, chapter) {
        bookId = Number(bookId);
        chapter = Number(chapter);
        let book = books[bookId];
        if (book !== undefined) {
            if (chapter < book.numChapters) {
                return [
                    bookId,
                    chapter + 1,
                    titleForBookChapter(book, chapter + 1)
                ];
            }

            let nextBook = books[bookId + 1];
            if (nextBook !== undefined) {
                let nextChapterValue = 0;

                if (nextBook.numChapters > 0) {
                    nextChapterValue = 1;
                }

                return [
                    nextBook.id,
                    nextChapterValue,
                    titleForBookChapter(nextBook, nextChapterValue)
                ];

            }
        }
    };
    onHashChanged = function () {
        let ids = [];
        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.slice(1).split(":");
        }
        if (ids.length <= 0) {
            navigateHome();
        } else if (ids.length === 1) {
            let volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes.slice(-1).id) {
                navigateHome();
            } else {
                navigateHome(volumeId);
            }
        } else if (ids.length >= 2) {
            let bookId = Number(ids[1]);

            if (books[bookId] === undefined) {
                navigateHome();
            } else {
                if (ids.length === 2) {
                    navigateBook(bookId);
                } else {
                    let chapter = Number(ids[2]);
                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }
        }
    };
    previousChapter = function (bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter > 1) {
                return [
                    bookId,
                    chapter - 1,
                    titleForBookChapter(book, chapter - 1)
                ];
            }

            let lastBook = books[bookId - 1];
            if (lastBook !== undefined) {
                let lastChapterValue = lastBook.numChapters;
                return [
                    lastBook.id,
                    lastChapterValue,
                    titleForBookChapter(lastBook, lastChapterValue)
                ];

            }
        }
    };
    setupMarkers = function () {
        if (window.google === undefined) {
            let retryId = window.setTimeout(setupMarkers, retryDelay);
            retryDelay += retryDelay;
            if (retryDelay > MAX_RETRY_DELAY) {
                window.clearTimeout(retryId);
            }
            return;
        }
        if (gmMarkers.length > 0) {
            clearMarkers();
        }
        document.querySelectorAll("a[onclick^=\"showLocation(\"]").forEach(
            function (element) {
                let matches =
                    LAT_LON_PARSER.exec(element.getAttribute("onclick"));
                if (matches) {
                    let placename = matches[INDEX_PLACENAME];
                    let latitude = matches[INDEX_LATITUDE];
                    let longitude = matches[INDEX_LONGITUDE];
                    let flag = matches[INDEX_FLAG];

                    if (flag !== "") {
                        placename += ` ${flag}`;
                    }
                    addMarker(placename, latitude, longitude);
                }
        });
        if (gmMarkers.length > 0) {
            centerMap();
        }
        if (gmMarkers.length === 1) {
            map.setZoom(8);
        }
    };
    showLocation = function (nothing, nothing2, latitude, longitude) {
        console.log(nothing);
        console.log(nothing2);
        map.setZoom(15);
        map.panTo({
            lat: latitude,
            lng: longitude
        });
    };
    titleForBookChapter = function (book, chapter) {
        if (book !== undefined) {
            if (chapter > 0) {
                return `${book.tocName} ${chapter}`;
            }
            return book.tocName;
        }
    };
    updateHash = function (bookId, chapter) {
        location.hash = `#0:${bookId}:${chapter}`;
    };
    volumesGridContent = function (volumeId) {
        let gridContent = "";
        volumes.forEach(function (volume) {
            if (volumeId === undefined || volumeId === volume.id) {
                gridContent += htmlDiv({
                    classKey: CLASS_VOLUME,
                    content: htmlElement(TAG_VOLUME_HEADER, volume.fullName)
                });
                gridContent += booksGrid(volume);
            }
        });
        return gridContent + BOTTOM_PADDING;
    };

    return {
        books,
        getIds,
        init,
        navigateChapter,
        nextChapter,
        onHashChanged,
        previousChapter,
        showLocation,
        volumes
};
}());