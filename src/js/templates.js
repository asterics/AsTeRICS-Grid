var templates = {};
var lastId = 1;

templates.getGridBase = function (gridId) {
    return `<ul id="${gridId}" class="grid">
                <li class="position-highlight" style="display: none;">
                    <div class="grid-item-content-placeholder"></div>
                </li>
            </ul>`;
};


templates.getGridItem = function (label, width, height, posX, posY, id, image) {
    width = width || 1;
    height = height || 1;
    posX = posX || 0;
    posY = posY || 0;
    id = id || lastId++;
    var imgData = Math.random() < 0.5 ? "http://oxydy.com/wp-content/uploads/2018/02/test-img.png" : "data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAw AAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFz ByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSp a/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJl ZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uis F81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PH hhx4dbgYKAAA7";;
    var imgId = '';
    if(image) {
        imgData = image.data;
        imgId = image.id;
    }

    var template = `
<li class="item" data-w="${width}" data-h="${height}" data-x="${posX}" data-y="${posY}" data-id="${id}" data-label="${label}" data-img-id="${imgId}" data-img="${imgData}">
    <div class="grid-item-content" id="${id}" data-id="${id}">
        <div class="img-container" style="background-color: #777620; background: center no-repeat; background-size: contain; background-image: url('${imgData}')"/>
        <div class="text-container"><span>${label}</span></div>
    </div>
</li>`;
    return template;
};

export {templates};