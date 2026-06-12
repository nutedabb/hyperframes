const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '50mb' }));

const BASE_DIR = '/tmp/hyperframes-jobs';
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });

// 1. Endpoint for n8n to submit the AI-generated HTML overlay code
app.post('/render', (req, res) => {
    const jobId = crypto.randomUUID();
    const projectDir = path.join(BASE_DIR, jobId);
    fs.mkdirSync(projectDir, { recursive: true });

    const htmlContent = req.body.html || "<html><body><h1>No Overlay Content</h1></body></html>";
    fs.writeFileSync(path.join(projectDir, 'index.html'), htmlContent);

    // Run your fork's native rendering CLI against the incoming HTML file
    const renderCmd = `npx hyperframes render --quality draft --output output.mp4`;
    
    exec(renderCmd, { cwd: projectDir }, (error, stdout, stderr) => {
        if (error) {
            fs.writeFileSync(path.join(projectDir, 'status.txt'), `failed: ${error.message}`);
            return;
        }
        fs.writeFileSync(path.join(projectDir, 'status.txt'), 'completed');
    });

    res.json({
        job_id: jobId,
        status: "processing",
        status_url: `https://${req.get('host')}/status/${jobId}`
    });
});

// 2. Endpoint for n8n to pull the completed video overlay file
app.get('/status/:jobId', (req, res) => {
    const projectDir = path.join(BASE_DIR, req.params.jobId);
    const videoFile = path.join(projectDir, 'output.mp4');

    if (fs.existsSync(videoFile)) {
        return res.sendFile(videoFile); // Sends raw video file binary back to n8n Cloud
    }
    res.json({ status: "processing" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HyperFrames Cloud Bridge active on port ${PORT}`));
