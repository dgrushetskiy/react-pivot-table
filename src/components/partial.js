

export function partial (fn) {
    const slice = Array.prototype.slice;
    const partialArgs = slice.call(arguments, 1);
    return function() {
        return fn.apply(this, partialArgs.concat(slice.call(arguments)))
    }
}