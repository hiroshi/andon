andon.js
========

Bind DOM with Firebase...,

but I'm sorry, I abandon it in favor of https://github.com/hiroshi/KnockoutFire.

Uage example
------------

In your firebase:

    {
      comments: {
        -XXXX: {
          user: "anon"
          text: "What andon mean?"
        }
        -YYYY: {
          user: "hiroshi"
          text: "A kind of Japanese paper lantern. A Candle fire lighten it from inside."
        }
      }
    }

In your html:

    <style type="text/stylesheet">
      .template { display:none; }
    </style>
    
    <ul id="comments">
      <li class="template">
        <span data-name="user"></span>
        <pre data-name="text"></pre>
      </li>
    </ul>
    
    <form id="comment-post" method="POST">
      <input type="text" name="user" />
      <textarea name="text"></textarea>
      <input type="submit">
    </form>
    
    <script type='text/javascript' src='http://code.jquery.com/jquery-1.9.1.min.js'></script>
    <script type='text/javascript' src='https://cdn.firebase.com/v0/firebase.js'></script>
    <script type='text/javascript' src='andon.js'></script>
    <script type="text/javascript">
      var firebase = new Firebase("https://yourdb.firebaseio-demo.com/comments");
      Andon.bind($("#comments"), firebase);
      Andon.form($("#comment-post"), firebase, {before: function(val) {
        val[".priority"] = Date.now();
      }});
    </script>
