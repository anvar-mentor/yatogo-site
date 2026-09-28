#!/usr/bin/env bash
# Установка сайта YATOGO на чистый Ubuntu 24.04.
# Запуск на сервере под root:
#   bash install.sh
# Повторный запуск безопасен — так же обновляет сайт до свежей версии.
set -euo pipefail

DOMAIN="yatogo.ru"
EMAIL="anvaryuldachev@gmail.com"          # для уведомлений Let's Encrypt
REPO="git@github.com:shototipabarmen-svg/saite_IP.git"   # приватный, доступ по deploy key
BRANCH="claude/lucid-ramanujan-6vysip"
WEBROOT="/var/www/yatogo"
SRC="/opt/yatogo-src"

[ "$(id -u)" -eq 0 ] || { echo "Запустите под root: sudo bash install.sh"; exit 1; }

# GitHub в known_hosts, чтобы git по SSH не задавал вопросов
mkdir -p ~/.ssh && ssh-keyscan -t ed25519 github.com 2>/dev/null >> ~/.ssh/known_hosts

echo "==> 1/6 Обновление системы и установка пакетов"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q nginx certbot python3-certbot-nginx git ufw

echo "==> 2/6 Файл подкачки 1 ГБ (страховка для 1 ГБ RAM)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> 3/6 Загрузка сайта из GitHub"
if [ -d "$SRC/.git" ]; then
  git -C "$SRC" fetch -q origin "$BRANCH" && git -C "$SRC" reset -q --hard "origin/$BRANCH"
else
  git clone -q --depth 1 -b "$BRANCH" "$REPO" "$SRC" || {
    echo "!! Не удалось скачать репозиторий. Проверьте, что ключ из ~/.ssh/id_ed25519.pub"
    echo "   добавлен в GitHub: Settings → Deploy keys."
    exit 1; }
fi
mkdir -p "$WEBROOT"
# Публикуем только файлы сайта, без служебных папок
rsync -a --delete --exclude '.git' --exclude '.claude' --exclude 'deploy' \
      --exclude 'api' --exclude 'README.md' "$SRC/" "$WEBROOT/" 2>/dev/null || {
  apt-get install -y -q rsync
  rsync -a --delete --exclude '.git' --exclude '.claude' --exclude 'deploy' \
        --exclude 'api' --exclude 'README.md' "$SRC/" "$WEBROOT/"; }
# Версия в ссылках на CSS/JS = номер коммита: после обновления браузеры
# сразу берут свежие файлы, а не старые из кэша
VER=$(git -C "$SRC" rev-parse --short HEAD)
sed -i "s/?v=[0-9A-Za-z]*\"/?v=$VER\"/g" "$WEBROOT/index.html"
chown -R www-data:www-data "$WEBROOT"

echo "==> 4/6 Настройка nginx"
cat > /etc/nginx/sites-available/yatogo <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    root $WEBROOT;
    index index.html;

    server_tokens off;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    # страницу браузер всегда перепроверяет — так он узнаёт о новых версиях CSS/JS
    location / { try_files \$uri \$uri/ /index.html; expires -1; }

    location ~* \.(css|js|svg|png|jpg|jpeg|webp|woff2)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
    location = /site.config.js { expires -1; }   # контакты меняются — не кэшировать
}
NGINX
ln -sf /etc/nginx/sites-available/yatogo /etc/nginx/sites-enabled/yatogo
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> 5/6 Файрвол"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null

echo "==> 6/6 HTTPS-сертификат"
SERVER_IP=$(curl -s4 https://ifconfig.me || true)
# || true: пока DNS не разошёлся, getent завершается с ошибкой, а set -e молча обрывал скрипт
DNS_IP=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1{print $1}' || true)
# AAAA (IPv6) тоже должна вести на этот сервер, иначе Let's Encrypt проверит
# домен по IPv6, попадёт на чужую страницу и потратит попытку (лимит — 5 в час).
SERVER_IP6=$(curl -s6 --max-time 5 https://ifconfig.me 2>/dev/null || true)
# Спрашиваем сами DNS-серверы домена (как делает Let's Encrypt), а не кэш
command -v dig >/dev/null || apt-get install -y -q dnsutils >/dev/null
NS=$(dig +short NS "$DOMAIN" @8.8.8.8 | head -1)
DNS_IP6=""
for host in "$DOMAIN" "www.$DOMAIN"; do
  v6=$(dig +short AAAA "$host" ${NS:+@$NS} | grep ':' | head -1 || true)
  if [ -n "$v6" ] && [ "$v6" != "$SERVER_IP6" ]; then DNS_IP6="$v6 ($host)"; fi
done
if [ -n "$DNS_IP6" ]; then
  echo; echo "Сайт работает по http://$SERVER_IP"
  echo "!! У домена есть AAAA-запись (IPv6) $DNS_IP6 — она ведёт не на этот сервер."
  echo "   Удалите AAAA-записи для $DOMAIN и www.$DOMAIN в панели DNS, подождите 15–30 минут"
  echo "   и запустите скрипт снова. Сертификат не запрашивал, чтобы не тратить попытки."
  exit 0
fi
if [ -n "$DNS_IP" ] && [ "$DNS_IP" = "$SERVER_IP" ]; then
  certbot --nginx -n --agree-tos -m "$EMAIL" --redirect \
          -d "$DOMAIN" -d "www.$DOMAIN" || \
  certbot --nginx -n --agree-tos -m "$EMAIL" --redirect -d "$DOMAIN"
  echo; echo "ГОТОВО: https://$DOMAIN"
else
  echo; echo "Сайт работает по http://$SERVER_IP"
  echo "!! Домен $DOMAIN указывает на '${DNS_IP:-никуда}', а сервер — $SERVER_IP."
  echo "   Пропишите A-записи у регистратора, подождите 15–60 минут и запустите скрипт снова —"
  echo "   он сам выпустит сертификат и включит HTTPS."
fi
