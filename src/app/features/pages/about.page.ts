// src/app/features/pages/about.page.ts

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideExternalLink, LucideShieldCheck } from '@lucide/angular';
import { GithubIconComponent } from '../shell/github-icon.component';
import { REPO_URL, SITE_URL } from '../shell/nav.constants';

@Component({
    selector: 'app-about-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, GithubIconComponent, LucideExternalLink, LucideShieldCheck],
    templateUrl: './about.page.html',
    host: { class: 'page' }
})
export class AboutPage {
    readonly repoUrl = REPO_URL;
    readonly siteUrl = SITE_URL;
}
