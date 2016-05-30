until npm start; do
    echo "Ameotrack crashed with exit code $?.  Respawning.." >&2
    sleep 1
done
