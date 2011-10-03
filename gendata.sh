#!/bin/zsh
mode=0644
slim=false
nofile=true
error=false
minthumb='150x112'
maxthumb='150x200'
maxout=1600x1200
fullq=100
imgq=90
orient=true

while getopts 'son' opt
do
  case $opt in
  s) slim=true;;
  n) nofile=true;;
  o) orient=false;;
  ?) error=true;;
  esac
done
shift $(($OPTIND - 1))

dir="$1"
out="$2"
name="${3:=$(basename -- "$dir")}"

if [ "$error" = "true" -o ! -d "$dir" -o -z "$out" ]
then
cat <<EOF >&2
Usage: $(basename $0) [-so] input-dir output-dir [album name]

  -s	slim output (no original files and downloads)
  -n	no files (no single original files, only full album download)
  -o	do not auto-orient
EOF
  exit 2
fi

setopt extended_glob

list=( (#i)$dir/*.(jpg|png) )
dirs=( $out/{thumbs,imgs} $out/files )
zlist=()

rm -rf $dirs || exit 1
mkdir -p $dirs || exit 1

thumbwidth=${maxthumb%x*}
thumbheight=${maxthumb#*x}

flags=()
[ "$orient" = "true" ] && flags+=(-auto-orient)

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
  if [ "$fullq" != "100" -o $(identify -format "%m" "$file") != "JPEG" ]
  then
    convert $flags -quality $fullq "$file" "$tmp"
    chmod $mode "$tmp"
    touch -r "$file" "$tmp"
  else
    # lossless path
    cp --preserve=timestamps "$file" "$tmp"
    chmod $mode "$tmp"
    [ "$orient" = "true" ] && exifautotran "$tmp" 2>/dev/null
  fi
  date=$(identify -format '%[EXIF:DateTime]' "$tmp")
  date=${date:=unknown}
  convert $flags -quality $imgq -thumbnail "$minthumb^" -gravity center -crop "$maxthumb+0x0" "$file" "$out/thumbs/$base.jpg"
  convert $flags -quality $imgq -geometry "$maxout" "$file" "$out/imgs/$base.jpg"

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
  elif [ "$nofile" = "true" ]
  then
    cat <<EOF >> "$out/data.js"
      dsc: "<strong>Date:</strong> $date (download: <a href=\"files/all.zip\">album</a>)"
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
  rm -r "$out/files"
else
  zip -q9j "$out/files/all.zip" $zlist
  [ "$nofile" = "true" ] && rm $zlist
fi

echo
