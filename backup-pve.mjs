#!/usr/bin/env zx
import 'zx/globals'
$.verbose = false

const DISK_LABEL = 'reserve'
const MOUNT_PATH = '/media/reserve'
const PVE_DUMP_PATH = '/var/lib/vz/dump/'

// ищем диск по метке
const disk = JSON.parse((await $`lsblk --json --list --output PATH,LABEL,MOUNTPOINT`).stdout)
	.blockdevices.find(disk => disk.label === DISK_LABEL)
if (!disk)
{
	echo("backup disk not found")
	process.exit()
}

// если есть, но не примонтирован, то примонтировать
if (!disk.mountpoint)
{
	echo("backup disk not mounted")
	echo("try mount...")
	await $`mount ${disk.path} ${MOUNT_PATH}`
}

// TODO выделить общую часть в отдельный общий файл

const BACKUP_DIR = 'backup_pve'

if (!(await fs.exists(`${MOUNT_PATH}/${BACKUP_DIR}`)))
{
	echo("backup path not found")
	process.exit()
}

// если успешно примонтирован, то можно синхронизировать
const syncProcess = $`rsync --archive --delete --verbose --human-readable --progress ${PVE_DUMP_PATH} ${MOUNT_PATH}/${BACKUP_DIR}`
for await (const chunk of syncProcess.stdout)
{
	echo(chunk)
}
