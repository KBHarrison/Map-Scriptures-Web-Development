const Scriptures = (function() {
    "use strict";
/******************************************Constants**********************************
*/
    let books;
    let volumes;
/******************************************Method Declaration**********************************
*/
    let ajax;
    let bookChapterValid;
    let cacheBooks;
    let clearMap;
    let init;
    let initMap;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let onHashChanged;

    /******************************************Functions**********************************
*/

    ajax = function(url, successCallback, failureCallback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                let data = JSON.parse(request.responseText);
                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof failureCallback === "funciton") {
                    failureCallback(request);
                }

            }
        };
        request.onerror = failureCallback;

        request.send();
    };
    bookChapterValid = function(bookId, chapter) {
        let book = books[bookId];
        if (book === "undefined" || chapter < 0 || chapter > book.numChapters) {
            return false;
        }
        if (chapter === 0 && book.numChapters > 0) {
            return false;
        }
        return true;
    };
    cacheBooks = function(callback) {
        volumes.forEach(volume => {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while(bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }
            volume.books = volumeBooks;
        });
        if (typeof callback === "function") {
            callback();
        }
    };
    clearMap = function(markers) {
        if (typeof markers !== "object") {
            return null
        }
        // markers.map((marker)=>{marker.setMap(null)});
        markers.forEach(val => val.setMap(null));
    };
    init = function(callback) {
        console.log("Scriptures Initialized");
        let booksLoaded = false;
        let volumesLoaded = false;
        ajax("https://scriptures.byu.edu/mapscrip/model/books.php", 
            data => {
                books = data;
                booksLoaded = true;
                console.log(books);
                if (volumesLoaded) {
                    cacheBooks(callback);
                }
            }
        );
        ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php", 
            data => {
                console.log(data);
                volumes = data;
                volumesLoaded = true;

                if (booksLoaded) {
                    cacheBooks(callback);
                }
            }
        );
    };
    navigateBook = function(bookId) {
        console.log("navigate chapter ", bookId);
    };
    navigateHome = function(volumeId) {
        document.getElementById("scriptures").innerHTML = 
        "<div>The Old Testament</div>" + 
        "<div>The New Testament</div>" + 
        "<div>The Book of Mormon</div>" + 
        "<div>Doctrine and Covenants</div>" + 
        "<div>The Pearl of Great Price</div>" + volumeId 
    };
    onHashChanged = function() {
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

return {
init: init,
onHashChanged: onHashChanged,
clearMap: clearMap,
books: books,
volumes: volumes
};

}());