var tempates = {};
tempates.getGridItem = function (number) {
    var template = `
<div class="item">
    <div class="item-content">
        <!-- Safe zone, enter your custom markup -->
        <div class="my-custom-content">
            ${number}
        </div>
        <!-- Safe zone ends -->
    </div>
</div>`;
    return template;
};

export {tempates};