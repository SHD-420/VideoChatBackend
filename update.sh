set -e

sudo rm -rf client

git clone --depth=1 --branch=deploy git@github.com:SHD-420/VideoChatFrontend.git client

rm -rf client/.git
