#!/bin/zsh
dir="$1"
out="$2"
maxthumb=x150
maxout=1600x1200

if [ ! -d "$dir" -o ! -d "$out" ]
then
  echo "Usage: $0 input-dir output-dir" >&2
  exit 2
fi

setopt extended_glob

list=( (#i)$dir/*.(jpg|png) )
dirs=( $out/{thumbs,imgs} $out/files )
zlist=()

rm -rf $dirs
mkdir -p $dirs

maxheight=${maxout#*x}
thumbheight=${maxthumb#*x}

cat <<EOF > "$out/data.js"
var imgs =
{
  download: "files/all.zip",
  maxheight: $maxheight,
  thumbheight: $thumbheight,
  data:
  [
EOF

for file in $list
do
  base=${file:r:t}
  tmp="$out/files/$base.jpg"
  zlist+=( $tmp )
  if [ ${file:e:l} != "jpg" ]
  then
    gm convert -quality 90 "$file" "$tmp"
  else
    cp "$file" "$tmp"
    exifautotran "$tmp" 2>/dev/null
  fi
  date=$(gm identify -format '%[EXIF:DateTime]' "$tmp")
  gm convert -geometry "$maxthumb" "$tmp" "$out/thumbs/$base.jpg"
  gm convert -geometry "$maxout" "$tmp" "$out/imgs/$base.jpg"

  cat <<EOF >> "$out/data.js"
    {
      file: "files/$base.jpg",
      img: "imgs/$base.jpg",
      thumb: "thumbs/$base.jpg",
      dsc: "<strong>Date:</strong> $date (download: <a href=\"files/$base.jpg\">$base</a>, <a href=\"files/all.zip\">album</a>)"
    },
EOF

  echo -n . >&2
done

cat <<EOF >> "$out/data.js"
  ]
}
EOF

zip -q9j "$out/files/all.zip" $zlist
echo
