const Scriptures = (function() {
    "use strict";

    let books;
    let volumes;

    let ajax;
    let cacheBooks;
    let clearMap;
    let init;
    let initMap;
    let onHashChanged;

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

                if (volumesLoaded) {
                    cacheBooks(callback);
                }
            }
        );
        ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php", 
            data => {
                volumes = data;
                volumesLoaded = true;

                if (booksLoaded) {
                    cacheBooks(callback);
                }
            }
        );
    };

    onHashChanged = function() {
        console.log("the hash is " + location.hash);
    };

return {
init: init,
onHashChanged: onHashChanged,
clearMap: clearMap,
books: books,
volumes: volumes
};

}());