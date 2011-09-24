#!/bin/zsh
slim=false
error=false
maxthumb=150x300
maxout=1600x1200

while getopts s opt
do
  case $opt in
  s) slim=true;;
  ?) error=true;;
  esac
done
shift $(($OPTIND - 1))

dir="$1"
out="$2"
name="${3:=$(basename -- '$dir')}"

if [ "$error" = "true" -o ! -d "$dir" -o -z "$out" ]
then
  echo "Usage: $0 [-s] input-dir output-dir [album name]" >&2
  exit 2
fi

setopt extended_glob

list=( (#i)$dir/*.(jpg|png) )
dirs=( $out/{thumbs,imgs} $out/files )
zlist=()

rm -rf $dirs
mkdir -p $dirs

thumbwidth=${maxthumb%x*}
thumbheight=${maxthumb#*x}

cat <<EOF > "$out/data.js"
var imgs =
{
EOF
if [ "$slim" != "true" ]
then
cat <<EOF >> "$out/data.js"
  download: "files/all.zip",
EOF
fi
cat <<EOF >> "$out/data.js"
  name: "$name",
  thumb: [ $thumbwidth, $thumbheight ],
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
      img: "imgs/$base.jpg",
      thumb: "thumbs/$base.jpg",
EOF
  if [ "$slim" = "true" ]
  then
    cat <<EOF >> "$out/data.js"
      dsc: "<strong>Date:</strong> $date"
EOF
  else
    cat <<EOF >> "$out/data.js"
      file: "files/$base.jpg",
      dsc: "<strong>Date:</strong> $date (download: <a href=\"files/$base.jpg\">$base</a>, <a href=\"files/all.zip\">album</a>)"
EOF
  fi
  cat <<EOF >> "$out/data.js"
    },
EOF

  echo -n . >&2
done

# trim the last , for f!ing IE
sed -i -e '$s/,$//' "$out/data.js"

cat <<EOF >> "$out/data.js"
  ]
};
EOF

if [ "$slim" = "true" ]
then
  rm -rf "$out/files"
else
  zip -q9j "$out/files/all.zip" $zlist
fi

echo
