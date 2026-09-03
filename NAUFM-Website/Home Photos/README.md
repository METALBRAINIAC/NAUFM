# Home Photos

Crew photos for the **Home tab slideshow** (the group shot area above
"Our Shows").

Add photos here named:

- `photo1.jpg`
- `photo2.jpg`
- `photo3.jpg`

The slideshow cycles through them automatically every 5 seconds. Want
more than 3? Add more files here (e.g. `photo4.jpg`) and add a
matching line in `index.html` — search for `HOME_PHOTOS_FOLDER` in
the `<script>` section, where you'll see:

```js
const teamPhotos = [
  HOME_PHOTOS_FOLDER + 'photo1.jpg',
  HOME_PHOTOS_FOLDER + 'photo2.jpg',
  HOME_PHOTOS_FOLDER + 'photo3.jpg'
];
```

Just add another line following the same pattern.
