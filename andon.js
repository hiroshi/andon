/*
  Andon.js - Bind DOM with Firebase

  Requirements: jQuery and firebase.js

  NOTE: All api may change in the prototype phase.

  TODO: update form
  TODO: on("value") for a single object
  TODO: The data attribute name "data-name" doesn't seem to be appropriate? "data-andon"?

  Author: Hiroshi Saito <hiroshi3110@gmail.com>
  License: CC BY 2.0
*/
Andon = {
    version: "0.0.0", // yet prototype version
    filters: {
        "safe": function(val) { return val; } // placeholder
    },
    debug: false // If true, print some log in console.
}
/*
  Andon.bind($target, firebase, options)

  Bind a jquery object with a firebase reference or query.

  Arguments:
    $target:
      Target jQuery object.
      $target.children(".template").length > 0: use on("child_added"), otherwise on("value")
    firebase:
      Firebase reference or query
    options:
      prepend: (default: true)
        If true prepend children to $target otherwise append them.

  Data attributes:
    data-name:
      Format: name[:reference][|filter1|filter2|...]
      Examples:
        "title"      -> $(this).text(val);
        "title|safe" -> $(this).html(val);
        "user_id:/users/$/nickname"

*/
Andon.bind = function ($target, firebase, options) {
    options = $.extend({prepend: true}, options)
    var child_template = $target.children(".template");
    if (child_template.length > 0) {
        firebase.on("child_added", function(childSnapshot) {
            Andon.debugLog("child_added: " + childSnapshot.ref().path);
            var $child = child_template.clone().removeClass("template")
                .attr("data-path", childSnapshot.ref().path.toString());
            if (options.prepend) {
                $target.prepend($child);
            } else {
                $target.append($child);
            }
            $child.find("[data-name]").each(function() {
                var $name = $(this);
                var name_and_filters = $name.data("name").split("|");
                var name_and_ref = name_and_filters[0].split(":");
                var name = name_and_ref[0];
                var ref = name_and_ref[1];
                var path = name.replace(".", "/");
                var filters = name_and_filters.slice(1);
                //var func = options.functions[name];
                childSnapshot.ref().child(path).on("value", function(valueSnapshot) {
                    Andon.debugLog("value: " + valueSnapshot.ref().path);
                    if (ref) {
                        // e.g. "/users/$/nickname" -> "/users/1234/nickname"
                        var ref_path = ref.replace("$", valueSnapshot.val());
                        var base_ref = childSnapshot.ref();
                        if (ref_path[0] == '/') {
                            base_ref = base_ref.root();
                        }
                        base_ref.child(ref_path).on("value", function(valRefSnapshot) {
                            $name.html(Andon.applyFilters(valRefSnapshot.val(), filters));
                        });
                    }
                    $name.html(Andon.applyFilters(valueSnapshot.val(), filters));
                });
            });
        });
        firebase.on("child_removed", function(childSnapshot) {
            Andon.debugLog("child_removed: " + childSnapshot.ref().path);
            var path = childSnapshot.ref().path.toString();
            var $child = $target.children("[data-path='" + path + "']").detach();
            $child.remove();
        });
        firebase.on("child_moved", function(childSnapshot, prevChildName) {
            Andon.debugLog("child_moved: " + childSnapshot.ref().path);
            var path = childSnapshot.ref().path.toString();
            var prev_path = prevChildName ? path.replace(childSnapshot.name(), prevChildName) : null;
            var $child = $target.children("[data-path='" + path + "']").detach();
            if (options.prepend) {
                if (prev_path) {
                    $target.children("[data-path='" + prev_path + "']").before($child);
                } else {
                    $target.prepend($child);
                }
            } else {
                if (prev_path) {
                    $target.children("[data-path='" + prev_path + "']").after($child);
                } else {
                    $target.append($child);
                }
            }
        });
    } else {
        console.error("Not implemented yet.");
    }
}
/*
  Andon.bind($form, firebase, options)

  Bind a jquery object for a form with a firebase reference or query.

  options:
    before: function(val)
*/
Andon.form = function ($form, firebase, options) {
    var path = firebase.path.toString();
    $form.attr("action", path);
    $form.on("submit", function(e) {
        var form = this;
        var val = $(form).serializeObject();
        if (options.before) {
            options.before(val);
        }
        firebase.push(val, function(error) {
            if (!error) {
                form.reset();
            } else {
                console.error(error);
            }
        });
        return false;
    });
}
/*
  Register a filter
*/
Andon.registerFilter = function (name, func) {
    Andon.filters[name] = func;
}
/*
  Internal functions
*/
Andon.applyFilters = function (val, filters) {
    filters.forEach(function(filter) {
        var func = Andon.filters[filter];
        if (func) {
            val = func(val);
        } else {
            console.error("Andon.js: No such filter: " + filter);
        }
    });
    if (filters.indexOf("safe") == -1) {
        val = $("<pre>").text(val).html();
    }
    return val;
}
Andon.debugLog = function (message) {
    if (this.debug) {
        console.debug("Andon: " + message);
    }
}
/*
  jQuery extension SerializeObject
*/
if (!$.fn.serializeObject) {
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    }
}
